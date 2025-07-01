from fastapi import APIRouter, HTTPException
from typing import Dict
from FastAPI_app.models import ResourceFetchRequest, ResourceFetchResponse
from FastAPI_app.db import get_db

router = APIRouter()

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
    encoding_ids : list[str] | None
        IDs of the encodings to fetch.
    ansatz_ids : list[str] | None
        IDs of the ansätze (approaches) to fetch.
    dataset_ids : list[str] | None
        IDs of the datasets to fetch.
    full : bool, default ``False``
        If ``True`` all information associated with the resource is returned.
        If ``False`` only a short description (name, description, depth) is
        included in the response.
    """
    try:
        db = get_db()
        docs = list(db.referenceData.find())
    except Exception as exc:
        # Database connection issues, propagate as 500
        raise HTTPException(status_code=500, detail="DB error") from exc

    # Combine all reference data docs into one lookup table per resource type
    encodings: Dict[str, Dict] = {}
    ansaetze: Dict[str, Dict] = {}
    datasets: Dict[str, Dict] = {}

    for doc in docs:
        data = doc.get("data", {})
        encodings.update(data.get("encodings", {}))
        ansaetze.update(data.get("ansaetze", {}))
        datasets.update(data.get("data", {}))  # nested "data" contains datasets

    def _summarise(item: Dict) -> Dict:
        """Return a short description of the resource."""
        return {
            "name": item.get("name"),
            "description": item.get("description"),
            "depth": item.get("depth")
        }

    result_encodings: Dict[str, Dict] = {}
    result_ansaetze: Dict[str, Dict] = {}
    result_datasets: Dict[str, Dict] = {}

    # Helper to populate results based on requested ids and detail flag
    def populate(ids, source, target):
        if not ids:
            return  # Nothing requested
        for _id in ids:
            item = source.get(str(_id))
            if item is None:
                continue  # silently ignore missing
            target[_id] = item if request.full else _summarise(item)

    populate(request.encoding_ids, encodings, result_encodings)
    populate(request.ansatz_ids, ansaetze, result_ansaetze)
    populate(request.dataset_ids, datasets, result_datasets)

    return ResourceFetchResponse(
        encodings=result_encodings,
        ansaetze=result_ansaetze,
        datasets=result_datasets,
    ) 