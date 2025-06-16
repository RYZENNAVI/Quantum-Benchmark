from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any

class Gate(BaseModel):
    type: str
    target: List[int]
    params: Optional[List[Union[float, str]]] = None
    control: Optional[List[int]] = None

class CircuitData(BaseModel):
    circuit: List[Gate]
    parameters: List[str]
    inputs: List[str]

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
    id: int

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
from pydantic import BaseModel