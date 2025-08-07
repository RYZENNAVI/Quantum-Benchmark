from dataclasses import dataclass, asdict

from fastapi     import APIRouter, Response, status
from pydantic    import BaseModel

from ..circuit   import Circuit, validate_circuit, calculate_qubit_count
from ..db        import get_db, get_next_id

class CreateRequest(BaseModel):
    name:    str
    circuit: Circuit


class CreateResponse(BaseModel):
    valid:  bool
    errors: list[str]
    id:     int | None


@dataclass
class Encoding:
    id:          int
    name:        str
    url:         str
    description: str
    circuit:     Circuit
    qubit_count: int


def encoding_from_create_request(request: CreateRequest) -> Encoding:
    return Encoding(
        id          = get_next_id("encodings"),
        name        = request.name,
        url         = '', # TODO: Take request data in the future.
        description = '', # TODO: Take request data in the future.
        circuit     = request.circuit,
        qubit_count = calculate_qubit_count(request.circuit),
    )

def get_db_collection():
    return get_db().encodings


"""Encoding API routes.

These endpoints validate and store quantum circuit encodings. The router is
mounted under ``/api`` in the main application.

Endpoints
---------

``POST   /encoding``
    Validate a quantum circuit definition and store it if valid.

``GET    /encoding``
    List all stored encodings.

``GET    /encoding/{object_id}``
    Retrieve a single encoding entry.

``PUT    /encoding/{object_id}``
    Update an existing encoding after validation.

``DELETE /encoding/{object_id}``
    Delete an encoding entry.
"""
router = APIRouter(prefix="/encoding", tags=["Resources"])


@router.post("/")
def create_new(request: CreateRequest, http_response: Response) -> CreateResponse:
    id:     int | None = None
    errors: list[str]  = []

    validation_errors = validate_circuit(request.circuit)

    if validation_errors is not None:
        errors += validation_errors


    if validation_errors is None:
        try:
            db = get_db()
            encoding = encoding_from_create_request(request)
            db.encodings.insert_one(asdict(encoding))

            id = encoding.id
            http_response.status_code = status.HTTP_200_OK
        except Exception as e:
            print("Exception in /api/encoding/:", e)  # 输出异常到日志
            http_response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            errors.append('Unable to persist in Database.')
    else:
        http_response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY

    return CreateResponse(
        id     = id,
        valid  = (len(errors) == 0),
        errors = errors,
    )
    

@router.get("/")
def get_all(response: Response):
    result = []

    try:
        docs = list(get_db_collection().find())

        for doc in docs:
            del doc["_id"]

        response.status_code = status.HTTP_200_OK
        result = docs
    except:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return result

@router.get("/{encoding_id}")
def get_by_id(encoding_id: int, response: Response):
    result = None

    try:
        doc = get_db_collection().find_one({"id": encoding_id})

        if doc:
            del doc["_id"]

            response.status_code = status.HTTP_200_OK
            result = doc
        else:
            response.status_code = status.HTTP_404_NOT_FOUND
    except:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    return result


@router.delete("/{encoding_id}")
def delete_by_id(encoding_id: int, response: Response):
    try:
        delete_response = get_db_collection().delete_one({ "id": encoding_id })

        if delete_response.deleted_count == 1:
            response.status_code = status.HTTP_200_OK
        else:
            response.status_code = status.HTTP_404_NOT_FOUND

    except:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

