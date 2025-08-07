from fastapi import APIRouter, HTTPException
from typing import Dict
from fastapi_app.models import ResourceFetchRequest, ResourceFetchResponse
from fastapi_app.db import get_db

router = APIRouter()

@router.get("/resources", response_model=ResourceFetchResponse)
def get_all_resources():
    """
    Fetch all resources (encodings, ansaetze, datasets) in a single call.

    Returns:
        ResourceFetchResponse or None: The ResourceFetchResponse object with all data in DB.
    """
    try:
        db = get_db()
        encoding_docs = list(db.encodings.find())
        ansatz_docs= list(db.ansaetze.find())
        dataset_docs = list(db.datasets.find())
    except Exception as exc:
        # Database connection issues, propagate as 500
        raise HTTPException(status_code=500, detail="DB error") from exc
    return convert_to_resourcefetchresponse(encoding_docs, ansatz_docs, dataset_docs)

@router.get("/resources/{collection}")
def get_collection_resources(collection: str):
    """
    Fetch all resources (encodings, ansaetze, datasets) of one collection.

    Returns:
        ResourceFetchResponse or None: The ResourceFetchResponse object with all data in one collection in DB.
    """
    try:
        db = get_db()
        match collection:
            case "encodings":
                encoding_docs = list(db.encodings.find())
                response = convert_to_resourcefetchresponse(encoding_docs, None, None)
            case "ansaetze":
                ansatz_docs = list(db.ansaetze.find())
                response = convert_to_resourcefetchresponse(None, ansatz_docs, None)
            case "datasets":
                dataset_docs = list(db.datasets.find())
                response = convert_to_resourcefetchresponse(None, None, dataset_docs)
            case _:
                response = convert_to_resourcefetchresponse(None, None, None)
    except Exception as exc:
        # Database connection issues, propagate as 500
        raise HTTPException(status_code=500, detail="DB error") from exc
    return response

@router.post("/resources", response_model=ResourceFetchResponse)
async def fetch_resources(request: ResourceFetchRequest) -> ResourceFetchResponse:
    """Fetch multiple resources (encodings, ansaetze, datasets) in a single call.

    The endpoint expects the IDs of the desired resources together with a flag
    indicating whether full information or only a short description is
    required.
    """
    """Request body for fetching multiple resources in a single call.

    Parameters
    ----------
    encoding_ids : list[int] | None
        IDs of the encodings to fetch.
    ansatz_ids : list[int] | None
        IDs of the ansätze (approaches) to fetch.
    dataset_ids : list[int] | None
        IDs of the datasets to fetch.
    full : bool, default ``False``
        If ``True`` all information associated with the resource is returned.
        If ``False`` only a short description (name, description, depth) is
        included in the response.
    """
    try:
        db = get_db()
        if request.encoding_ids:
            encoding_docs = list(db.encodings.find({"id": {"$in": request.encoding_ids}}))
        else:
            encoding_docs = []
        if request.ansatz_ids:
            ansatz_docs = list(db.ansaetze.find({"id": {"$in": request.ansatz_ids}}))
        else:
            ansatz_docs = []
        if request.dataset_ids:
            dataset_docs = list(db.datasets.find({"id": {"$in": request.dataset_ids}}))
        else:
            dataset_docs = []
    except Exception as exc:
        # Database connection issues, propagate as 500
        raise HTTPException(status_code=500, detail="DB error") from exc

    # Combine all reference data docs into one lookup table per resource type

    def _summarise(item: Dict) -> Dict:
        """Return a short description of the resource."""
        return {
            "name": item.get("name"),
            "description": item.get("description"),
            "depth": item.get("depth", None)
        }

    if request.full:
        return convert_to_resourcefetchresponse(encoding_docs, ansatz_docs, dataset_docs)
    else:
        encodings = {encoding["id"]: _summarise(encoding) for encoding in encoding_docs}
        ansaetze = {ansatz["id"]: _summarise(ansatz) for ansatz in ansatz_docs}
        datasets = {dataset["id"]: _summarise(dataset) for dataset in dataset_docs}
        return ResourceFetchResponse(
            encodings=encodings,
            ansaetze=ansaetze,
            datasets=datasets
        )

def convert_to_resourcefetchresponse(encoding_docs, ansatz_docs, dataset_docs):
    for doc in encoding_docs or []:
        doc.pop("_id", None)
    for doc in ansatz_docs or []:
        doc.pop("_id", None)
    for doc in dataset_docs or []:
        doc.pop("_id", None)
    encodings = {encoding["id"]: encoding for encoding in (encoding_docs or [])}
    ansaetze = {ansatz["id"]: ansatz for ansatz in (ansatz_docs or [])}
    datasets = {dataset["id"]: dataset for dataset in (dataset_docs or [])}
    return ResourceFetchResponse(
        encodings=encodings,
        ansaetze=ansaetze,
        datasets=datasets
    )