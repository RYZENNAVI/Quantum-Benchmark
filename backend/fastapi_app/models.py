from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any
from pydantic import root_validator

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

    @root_validator(pre=True)
    def sync_aliases(cls, values):
        # gate / type
        values = cls._ensure_alias(values, 'gate', 'type')
        # wires / target
        values = cls._ensure_alias(values, 'wires', 'target')
        return values

    class Config:
        extra = 'allow'  # Ignore unexpected keys to stay permissive

class CircuitData(BaseModel):
    circuit: List[Gate]
    parameters: List[str]
    inputs: List[str]
    qubits: Optional[int] = None

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
    encoding_id: int
    ansatz_id: int
    data_id: int

class RunBenchmarkResponse(BaseModel):
    message: str
    id: str

# Models for Benchmark Result API
class BenchmarkResult(BaseModel):
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
    encodings: Dict[str, EncodingResultInfo]
    ansaetze: Dict[str, AnsatzResultInfo]

# Models for Multi-Resource Fetch API
class ResourceFetchRequest(BaseModel):
    encoding_ids: Optional[List[str]] = Field(default_factory=list)
    ansatz_ids: Optional[List[str]] = Field(default_factory=list)
    dataset_ids: Optional[List[str]] = Field(default_factory=list)
    full: bool = False

class ResourceFetchResponse(BaseModel):
    """Aggregated response containing the requested resources."""
    encodings: Dict[str, Any] = Field(default_factory=dict)
    ansaetze: Dict[str, Any] = Field(default_factory=dict)
    datasets: Dict[str, Any] = Field(default_factory=dict)