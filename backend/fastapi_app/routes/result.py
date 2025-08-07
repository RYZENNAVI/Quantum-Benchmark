from fastapi import APIRouter, HTTPException, Body
from fastapi_app.models import BenchmarkResult, BenchmarkResultResponse, EncodingResultInfo, AnsatzResultInfo
from fastapi_app.db import get_db
from datetime import datetime, UTC
import traceback
from bson import ObjectId
from bson.errors import InvalidId
from typing import Dict, List

router = APIRouter()

"""Benchmark result API routes.

Endpoints manage the storage and retrieval of benchmark results produced by
the worker process. The router is mounted under ``/api`` in the main
application.

Endpoints
---------
``POST   /result``
    Store a new benchmark result document.

``GET    /result``
    Retrieve all benchmark results with associated encoding and ansatz info.

``GET    /result/{object_id}``
    Retrieve a specific benchmark result.

``PUT    /result/{object_id}``
    Update an existing benchmark result document.

``DELETE /result/{object_id}``
    Delete a benchmark result document.
"""

@router.post("/result", response_model=dict)
async def create_benchmark_result(result: BenchmarkResult = Body(...)):
    try:
        db = get_db()
        result_doc = db.benchmarkResults.insert_one({
            "run_id": result.run_id,
            "encoding_id": result.encoding_id,
            "ansatz_id": result.ansatz_id,
            "data_id": result.data_id,
            "loss": result.loss,
            "accuracy": result.accuracy,
            "timestamp": datetime.now(UTC)
        })
        return {"message": f"Created benchmark result with ID {str(result_doc.inserted_id)}", "id": str(result_doc.inserted_id)}
    except Exception:
        traceback.print_exc()
        # TODO: Replace with more specific error message
        raise HTTPException(status_code=500, detail="DB error")

@router.get("/result", response_model=BenchmarkResultResponse)
def get_all_benchmark_results():
    try:
        db = get_db()
        
        # Get all benchmark results
        results_docs = list(db.benchmarkResults.find())
        results = []
        encoding_ids = set()
        ansatz_ids = set()
        for doc in results_docs:
            # Some legacy documents might miss run_id; skip them
            if "run_id" not in doc:
                continue
            results.append(BenchmarkResult(
                run_id=doc["run_id"],
                encoding_id=doc["encoding_id"],
                ansatz_id=doc["ansatz_id"],
                data_id=doc["data_id"],
                loss=doc["loss"],
                accuracy=doc["accuracy"]
            ))
            encoding_ids.add(doc["encoding_id"])
            ansatz_ids.add(doc["ansatz_id"])
        
        # Get encoding information from referenceData
        encodings = {}
        ansaetze = {}
        
        ansatz_docs = list(db.ansaetze.find())
        encoding_docs = list(db.encodings.find())
        for doc in encoding_docs:
            if doc["id"] in encoding_ids:
                encodings[doc["id"]] = EncodingResultInfo(
                    depth=doc.get("depth", 0),
                    name=doc.get("name", ""),
                    description=doc.get("description", "")
                )
        for doc in ansatz_docs:
            if doc["id"] in ansatz_ids:
                ansaetze[doc["id"]] = AnsatzResultInfo(
                    depth=doc.get("depth", 0),
                    name=doc.get("name", ""),
                    description=doc.get("description", "")
                )
        
        return BenchmarkResultResponse(
            results=results,
            encodings=encodings,
            ansaetze=ansaetze
        )
    except Exception:
        traceback.print_exc()
        # TODO: Replace with more specific error message
        raise HTTPException(status_code=500, detail="DB error")

@router.get("/result/{run_id}")
def get_benchmark_result_by_id(run_id: int):
    db = get_db()
    doc = db.benchmarkResults.find_one({"run_id": run_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["_id"] = str(doc["_id"])
    return doc

@router.delete("/result/{object_id}")
def delete_benchmark_result_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.benchmarkResults.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Deleted {object_id}"}

@router.put("/result/{object_id}")
def update_benchmark_result_by_id(object_id: str, result: BenchmarkResult = Body(...)):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    update_result = db.benchmarkResults.update_one(
        {"_id": obj_id},
        {"$set": {
            "run_id": result.run_id,
            "encoding_id": result.encoding_id,
            "ansatz_id": result.ansatz_id,
            "data_id": result.data_id,
            "loss": result.loss,
            "accuracy": result.accuracy,
            "timestamp": datetime.now(UTC)
        }}
    )
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}