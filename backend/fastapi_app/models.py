from pydantic import BaseModel, Field, model_validator, field_validator, ConfigDict
from typing import List, Optional, Union, Dict, Any

class Gate(BaseModel):
    """Single quantum gate definition.

    The backend now supports both the *legacy* field names (``type`` / ``target``)
    and the *new* names (``gate`` / ``wires``).  To maintain full
    backward-compatibility we expose **both** sets of attributes as optional and
    mirror their values in a root-validator so that downstream code can safely
    access either variant.
    """

    # New preferred names
    gate: Optional[str] = None
    wires: Optional[List[int]] = None

    # Legacy aliases still accepted by the API layer
    type: Optional[str] = None
    target: Optional[List[int]] = None

    # Additional optional fields
    params: Optional[List[Union[float, str]]] = None
    control: Optional[List[int]] = None

    @classmethod
    def _ensure_alias(cls, values: dict, new_key: str, old_key: str):
        """If only one alias is provided copy it to the missing one."""
        if new_key in values and old_key not in values:
            values[old_key] = values[new_key]
        elif old_key in values and new_key not in values:
            values[new_key] = values[old_key]
        return values

    @model_validator(mode='before')
    @classmethod
    def sync_aliases(cls, values):
        # gate / type
        values = cls._ensure_alias(values, 'gate', 'type')
        # wires / target
        values = cls._ensure_alias(values, 'wires', 'target')
        return values

    model_config = ConfigDict(extra='allow')  # Ignore unexpected keys to stay permissive

class CircuitData(BaseModel):
    """Schema for a quantum encoding circuit.

    Top-level ``parameters`` and ``inputs`` have been deprecated.  Each gate now
    stores its own parameter references directly in the ``params`` list using
    either a numeric constant or the placeholder ``"input_<index>"``.
    ``parameters`` and ``inputs`` remain *optional* to allow backward
    compatibility but are no longer validated or required.
    """

    circuit: List[Gate]

    # New preferred name -------------------------------------------------------
    qubit_count: Optional[int] = Field(None, alias="qubit_count")
    # Legacy alias still accepted
    qubits: Optional[int] = Field(None, alias="qubits")

    @model_validator(mode='before')
    @classmethod
    def sync_qubit_aliases(cls, values):
        """Mirror values between *qubit_count* and the legacy *qubits* key."""
        if 'qubit_count' in values and 'qubits' not in values:
            values['qubits'] = values['qubit_count']
        elif 'qubits' in values and 'qubit_count' not in values:
            values['qubit_count'] = values['qubits']
        return values

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str]

# Models for ReferenceData API
class EncodingInfo(BaseModel):
    depth: int
    name: str
    description: str
    circuit: Dict[str, Any]

class AnsatzInfo(BaseModel):
    depth: int
    name: str
    description: str
    circuit: Dict[str, Any]

class DatasetInfo(BaseModel):
    depth: int
    name: str
    description: str

class ReferenceData(BaseModel):
    encodings: Dict[str, EncodingInfo]
    ansaetze: Dict[str, AnsatzInfo]
    data: Dict[str, DatasetInfo]

# Models for Run Benchmark API
class RunBenchmarkRequest(BaseModel):
    encoding_id: Union[int, List[int]]
    ansatz_id: Union[int, List[int]]
    data_id: Union[int, List[int]]

    @field_validator("encoding_id", "ansatz_id", "data_id", mode='before')
    @classmethod
    def ensure_int_or_int_list(cls, v):
        if isinstance(v, (int, str)):
            return int(v)
        if isinstance(v, list):
            return [int(item) for item in v]
        raise ValueError("Value must be an integer or a list of integers")

class RunBenchmarkResponse(BaseModel):
    message: str
    id: int

# Models for Benchmark Result API
class BenchmarkResult(BaseModel):
    run_id: int
    encoding_id: int
    ansatz_id: int
    data_id: int
    loss: float
    accuracy: float

class EncodingResultInfo(BaseModel):
    depth: int
    name: str
    description: str

class AnsatzResultInfo(BaseModel):
    depth: int
    name: str
    description: str

class BenchmarkResultResponse(BaseModel):
    results: List[BenchmarkResult]
    encodings: Dict[int, EncodingResultInfo]
    ansaetze: Dict[int, AnsatzResultInfo]

# Models for Multi-Resource Fetch API
class ResourceFetchRequest(BaseModel):
    encoding_ids: Optional[List[int]] = Field(default_factory=list)
    ansatz_ids: Optional[List[int]] = Field(default_factory=list)
    dataset_ids: Optional[List[int]] = Field(default_factory=list)
    full: bool = False

class ResourceFetchResponse(BaseModel):
    """Aggregated response containing the requested resources."""
    encodings: Dict[int, Any] = Field(default_factory=dict)
    ansaetze: Dict[int, Any] = Field(default_factory=dict)
    datasets: Dict[int, Any] = Field(default_factory=dict)

