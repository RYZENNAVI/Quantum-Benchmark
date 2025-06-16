from fastapi import APIRouter, HTTPException, Body
from FastAPI_app.models import CircuitData, ValidationResult
from FastAPI_app.db import get_db
from FastAPI_app.rabbitmq import rabbitmq
from FastAPI_app.quantum_validator.quantum_validator import validate_quantum_circuit_from_dict
from datetime import datetime
import traceback
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

@router.post("/encode")
def send_encoding_to_worker(encoding_id: int):
    try:
        rabbitmq.send_message(str(encoding_id))
        return True
    except Exception:
        traceback.print_exc()
        return False

@router.post("/encoding", response_model=ValidationResult)
async def validate_circuit(circuit: CircuitData = Body(...)):
    try:
        result = validate_quantum_circuit_from_dict(circuit.dict())
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Validation error")

    if result["valid"]:
        try:
            db = get_db()
            db.encodingHistory.insert_one({
                "circuit": circuit.dict(),
                "valid": True,
                "errors": [],
                "timestamp": datetime.utcnow()
            })
        except Exception:
            traceback.print_exc()
            # TODO: Replace with more specific error message
            raise HTTPException(status_code=500, detail="DB error")
    return result

@router.get("/encoding")
def list_all_circuits():
    db = get_db()
    docs = list(db.encodingHistory.find())
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs

@router.get("/encoding/{object_id}")
def get_circuit_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = db.encodingHistory.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["_id"] = str(doc["_id"])
    return doc

@router.delete("/encoding/{object_id}")
def delete_circuit_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.encodingHistory.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Deleted {object_id}"}

@router.put("/encoding/{object_id}")
def update_circuit_by_id(object_id: str, circuit: CircuitData = Body(...)):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    try:
        validation_result = validate_quantum_circuit_from_dict(circuit.dict())
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Validation error")
    if not validation_result["valid"]:
        return ValidationResult(valid=False, errors=validation_result["errors"])
    result = db.encodingHistory.update_one(
        {"_id": obj_id},
        {"$set": {
            "circuit": circuit.dict(),
            "valid": True,
            "errors": [],
            "timestamp": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}
