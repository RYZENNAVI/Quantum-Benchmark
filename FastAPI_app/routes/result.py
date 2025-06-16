from fastapi import APIRouter, HTTPException, Body
from FastAPI_app.models import BenchmarkResult, BenchmarkResultResponse, EncodingResultInfo, AnsatzResultInfo
from FastAPI_app.db import get_db
from datetime import datetime
import traceback
from bson import ObjectId
from bson.errors import InvalidId
from typing import Dict, List

router = APIRouter()

@router.post("/result", response_model=dict)
async def create_benchmark_result(result: BenchmarkResult = Body(...)):
    try:
        db = get_db()
        result_doc = db.benchmarkResults.insert_one({
            "encoding_id": result.encoding_id,
            "ansatz_id": result.ansatz_id,
            "data_id": result.data_id,
            "loss": result.loss,
            "accuracy": result.accuracy,
            "timestamp": datetime.utcnow()
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
            results.append(BenchmarkResult(
                encoding_id=doc["encoding_id"],
                ansatz_id=doc["ansatz_id"],
                data_id=doc["data_id"],
                loss=doc["loss"],
                accuracy=doc["accuracy"]
            ))
            encoding_ids.add(str(doc["encoding_id"]))
            ansatz_ids.add(str(doc["ansatz_id"]))
        
        # Get encoding information from referenceData
        encodings = {}
        ansaetze = {}
        
        reference_docs = list(db.referenceData.find())
        for ref_doc in reference_docs:
            if "data" in ref_doc and "encodings" in ref_doc["data"]:
                for enc_id, enc_info in ref_doc["data"]["encodings"].items():
                    if enc_id in encoding_ids:
                        encodings[enc_id] = EncodingResultInfo(
                            depth=enc_info.get("depth", 0),
                            name=enc_info.get("name", ""),
                            description=enc_info.get("description", "")
                        )
            
            if "data" in ref_doc and "ansaetze" in ref_doc["data"]:
                for ans_id, ans_info in ref_doc["data"]["ansaetze"].items():
                    if ans_id in ansatz_ids:
                        ansaetze[ans_id] = AnsatzResultInfo(
                            depth=ans_info.get("depth", 0),
                            name=ans_info.get("name", ""),
                            description=ans_info.get("description", "")
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

@router.get("/result/{object_id}")
def get_benchmark_result_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = db.benchmarkResults.find_one({"_id": obj_id})
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
            "encoding_id": result.encoding_id,
            "ansatz_id": result.ansatz_id,
            "data_id": result.data_id,
            "loss": result.loss,
            "accuracy": result.accuracy,
            "timestamp": datetime.utcnow()
        }}
    )
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}