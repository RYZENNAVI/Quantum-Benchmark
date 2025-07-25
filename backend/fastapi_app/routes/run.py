from fastapi import APIRouter, HTTPException, Body
from FastAPI_app.models import RunBenchmarkRequest, RunBenchmarkResponse
from FastAPI_app.db import get_db
from FastAPI_app.rabbitmq import rabbitmq
from datetime import datetime
import traceback
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

"""Benchmark run API routes.

These endpoints coordinate benchmark executions. Requests are stored in
MongoDB and tasks are dispatched to the worker via RabbitMQ. The router is
mounted under ``/api``.

Endpoints
---------
``POST   /run``
    Create a benchmark run request and send it to the worker.

``GET    /run``
    List all benchmark run requests.

``GET    /run/{object_id}``
    Retrieve a single benchmark run by id.

``PUT    /run/{object_id}``
    Update the parameters of an existing run request.

``DELETE /run/{object_id}``
    Delete a benchmark run entry.
"""

@router.post("/run", response_model=RunBenchmarkResponse)
async def start_benchmark(request: RunBenchmarkRequest = Body(...)):
    try:
        db = get_db()
        # Insert benchmark request into database
        result = db.benchmarkRuns.insert_one({
            "encoding_id": request.encoding_id,
            "ansatz_id": request.ansatz_id,
            "data_id": request.data_id,
            "status": "pending",
            "timestamp": datetime.utcnow()
        })
        
        # Determine qubits count from stored encoding, default to 0 if unavailable
        qubits_count = 0
        try:
            enc_doc = db.encodingHistory.find_one({"_id": ObjectId(request.encoding_id)})
            if enc_doc and "circuit" in enc_doc:
                circuit_def = enc_doc["circuit"].get("circuit", [])
                indices = []
                for gate in circuit_def:
                    indices.extend(gate.get("target", []))
                    if "control" in gate and isinstance(gate["control"], list):
                        indices.extend(gate["control"])
                if indices:
                    qubits_count = max(indices) + 1
        except Exception:
            # Fallback to 0; worker may recompute if needed
            traceback.print_exc()

        # Send benchmark task to RabbitMQ worker
        task_data = {
            "run_id": str(result.inserted_id),
            "encoding_id": request.encoding_id,
            "ansatz_id": request.ansatz_id,
            "data_id": request.data_id,
            "measure_index": 0,
            "qubits": qubits_count
        }
        
        try:
            rabbitmq.send_message(str(task_data))
        except Exception:
            traceback.print_exc()
            # Update status to failed if RabbitMQ fails
            db.benchmarkRuns.update_one(
                {"_id": result.inserted_id},
                {"$set": {"status": "failed", "error": "Failed to send to worker"}}
            )
            raise HTTPException(status_code=500, detail="Failed to start benchmark")
        
        return RunBenchmarkResponse(
            message=f"Created benchmark run with ID {str(result.inserted_id)}",
            id=str(result.inserted_id)
        )
        
    
    except Exception:
        traceback.print_exc()
        # TODO: Replace with more specific error message
        raise HTTPException(status_code=500, detail="DB error")

@router.get("/run")
def list_all_benchmark_runs():
    db = get_db()
    docs = list(db.benchmarkRuns.find())
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs

@router.get("/run/{object_id}")
def get_benchmark_run_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = db.benchmarkRuns.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["_id"] = str(doc["_id"])
    return doc

@router.delete("/run/{object_id}")
def delete_benchmark_run_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.benchmarkRuns.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Deleted {object_id}"}

@router.put("/run/{object_id}")
def update_benchmark_run_by_id(object_id: str, request: RunBenchmarkRequest = Body(...)):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.benchmarkRuns.update_one(
        {"_id": obj_id},
        {"$set": {
            "encoding_id": request.encoding_id,
            "ansatz_id": request.ansatz_id,
            "data_id": request.data_id,
            "status": "pending",
            "timestamp": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}