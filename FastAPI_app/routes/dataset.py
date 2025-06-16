from fastapi import APIRouter, HTTPException, Body
from FastAPI_app.models import ReferenceData, EncodingInfo, AnsatzInfo, DatasetInfo
from FastAPI_app.db import get_db
from datetime import datetime
import traceback
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

@router.post("/dataset", response_model=dict)
async def create_reference_data(reference_data: ReferenceData = Body(...)):
    try:
        db = get_db()
        result = db.referenceData.insert_one({
            "data": reference_data.dict(),
            "timestamp": datetime.utcnow()
        })
        return {"message": f"Created reference data with ID {str(result.inserted_id)}", "id": str(result.inserted_id)}
    except Exception:
        traceback.print_exc()
        # TODO: Replace with more specific error message
        raise HTTPException(status_code=500, detail="DB error")

@router.get("/dataset")
def list_all_reference_data():
    db = get_db()
    docs = list(db.referenceData.find())
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs

@router.get("/dataset/{object_id}")
def get_reference_data_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = db.referenceData.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["_id"] = str(doc["_id"])
    return doc

@router.delete("/dataset/{object_id}")
def delete_reference_data_by_id(object_id: str):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.referenceData.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Deleted {object_id}"}

@router.put("/dataset/{object_id}")
def update_reference_data_by_id(object_id: str, reference_data: ReferenceData = Body(...)):
    db = get_db()
    try:
        obj_id = ObjectId(object_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = db.referenceData.update_one(
        {"_id": obj_id},
        {"$set": {
            "data": reference_data.dict(),
            "timestamp": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": f"Updated {object_id}"}