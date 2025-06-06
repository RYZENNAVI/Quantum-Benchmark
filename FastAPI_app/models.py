from pydantic import BaseModel, Field
from typing import List, Optional, Union

class Gate(BaseModel):
    id: str
    type: str
    target: List[int]
    timeStep: int
    params: Optional[List[Union[float, str]]] = None
    control: Optional[List[int]] = None

class CircuitData(BaseModel):
    circuit: List[Gate]
    parameters: List[str]
    inputs: List[str]

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str]
