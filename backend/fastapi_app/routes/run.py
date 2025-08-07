from fastapi import APIRouter, HTTPException, Body
from fastapi_app.models import RunBenchmarkRequest, RunBenchmarkResponse
from fastapi_app.db import get_db, get_next_id
from fastapi_app.rabbitmq import rabbitmq
from datetime import datetime, UTC
from typing import List
import traceback
from bson import ObjectId
from bson.errors import InvalidId
from itertools import product

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

        # ---- Accept list or single value ----
        encoding_ids = request.encoding_id if isinstance(request.encoding_id, list) else [request.encoding_id]
        ansatz_ids = request.ansatz_id if isinstance(request.ansatz_id, list) else [request.ansatz_id]
        data_ids = request.data_id if isinstance(request.data_id, list) else [request.data_id]

        created_ids: List[str] = []

        for enc_id, anz_id, d_id in product(encoding_ids, ansatz_ids, data_ids):
            # Insert benchmark run into the database
            run_id = get_next_id("benchmarkRuns")
            result = db.benchmarkRuns.insert_one({
                "id": run_id,
                "encoding_id": enc_id,
                "ansatz_id": anz_id,
                "data_id": d_id,
                "status": "pending",
                "timestamp": datetime.now(UTC)
            })

            # Estimate qubit count (best effort; non-critical)
            qubits_count = 0
            try:
                enc_doc = db.encodingHistory.find_one({"_id": ObjectId(enc_id)})
                if enc_doc and "circuit" in enc_doc:
                    circuit_def = enc_doc["circuit"].get("circuit", [])
                    indices = []
                    for gate in circuit_def:
                        # Support both 'target' and 'wires' keys
                        indices.extend(gate.get("target", gate.get("wires", [])))
                        if "control" in gate and isinstance(gate.get("control"), list):
                            indices.extend(gate["control"])
                    if indices:
                        qubits_count = max(indices) + 1
            except Exception:
                traceback.print_exc()

            # Send task to RabbitMQ
            task_data = {
                "run_id": run_id,
                "encoding_id": enc_id,
                "ansatz_id": anz_id,
                "data_id": d_id,
                "measure_index": 0,
                "qubit_count": qubits_count
            }

            try:
                rabbitmq.send_message(str(task_data))
            except Exception:
                traceback.print_exc()
                db.benchmarkRuns.update_one(
                    {"id": run_id},
                    {"$set": {"status": "failed", "error": "Failed to send to worker"}}
                )
                # Do not abort loop; continue with remaining tasks
                continue

            created_ids.append(run_id)

        if not created_ids:
            raise HTTPException(status_code=500, detail="Failed to start any benchmark task")

        return RunBenchmarkResponse(
            message=f"Successfully created {len(created_ids)} benchmark task(s): {created_ids}",
            id=created_ids[0]
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

@router.get("/run/{run_id}")
def get_benchmark_run_by_id(run_id: int):
    db = get_db()
    doc = db.benchmarkRuns.find_one({"id": run_id})
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
            "timestamp": datetime.now(UTC)
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}
