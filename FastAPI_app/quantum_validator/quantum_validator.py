import json
import os
from typing import Dict, List, Union

class QuantumCircuitValidator:
    SUPPORTED_GATE_TYPES = {'H', 'X', 'Y', 'Z', 'RX', 'RY', 'RZ', 'CNOT', 'CZ', 'SWAP', 'MEASURE'}
    PARAMETERIZED_GATES = {'RX', 'RY', 'RZ'}
    CONTROLLED_GATES = {'CNOT', 'CZ'}

    def __init__(self):
        self.validation_errors: List[str] = []
        self.circuit_data: Dict = {}

    def validate_from_file(self, file_path: str) -> bool:
        if not os.path.exists(file_path):
            self.validation_errors.append(f"File does not exist: {file_path}")
            return False

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return self.validate(data)
        except json.JSONDecodeError as e:
            self.validation_errors.append(f"JSON parsing error: {str(e)}")
            return False
        except Exception as e:
            self.validation_errors.append(f"File reading error: {str(e)}")
            return False

    def validate(self, data: Dict) -> bool:
        self.validation_errors = []
        self.circuit_data = data

        self._validate_top_level_structure()
        if self.validation_errors:
            return False

        all_qubit_indices = self._collect_all_qubit_indices()
        self._validate_gates(all_qubit_indices)

        if not self.validation_errors:
            self._validate_time_conflicts()

        return len(self.validation_errors) == 0

    def get_errors(self) -> List[str]:
        return self.validation_errors

    def _validate_top_level_structure(self) -> None:
        if 'circuit' not in self.circuit_data or not isinstance(self.circuit_data['circuit'], list):
            self.validation_errors.append("Missing or invalid 'circuit'")
        if 'parameters' not in self.circuit_data or not isinstance(self.circuit_data['parameters'], list):
            self.validation_errors.append("Missing or invalid 'parameters'")
        if 'inputs' not in self.circuit_data or not isinstance(self.circuit_data['inputs'], list):
            self.validation_errors.append("Missing or invalid 'inputs'")

    def _collect_all_qubit_indices(self) -> List[int]:
        indices = []
        circuit = self.circuit_data.get('circuit', [])
        for gate in circuit:
            tgt = gate.get('target', [])
            if isinstance(tgt, list):
                indices.extend(t for t in tgt if isinstance(t, int))
            ctrl = gate.get('control')
            if isinstance(ctrl, list):
                indices.extend(c for c in ctrl if isinstance(c, int))
        return indices

    def _validate_gates(self, all_qubit_indices: List[int]) -> None:
        circuit = self.circuit_data.get('circuit', [])
        parameters = self.circuit_data.get('parameters', [])
        gate_ids = set()
        last_index = len(circuit) - 1

        for idx, gate in enumerate(circuit):
            if not isinstance(gate, dict):
                self.validation_errors.append(f"Gate #{idx+1} must be a dict")
                continue

            for field in ['id', 'type', 'target', 'timeStep']:
                if field not in gate:
                    self.validation_errors.append(f"Gate #{idx+1} missing '{field}'")
            if any(field not in gate for field in ['id', 'type', 'target', 'timeStep']):
                continue

            gate_id = gate['id']
            if not isinstance(gate_id, str) or gate_id in gate_ids:
                self.validation_errors.append(f"Gate #{idx+1}: invalid or duplicate 'id'")
            else:
                gate_ids.add(gate_id)

            gate_type = gate['type']
            if gate_type not in self.SUPPORTED_GATE_TYPES:
                self.validation_errors.append(f"Gate #{idx+1}: unsupported 'type' {gate_type}")
            if gate_type == 'MEASURE' and idx != last_index:
                self.validation_errors.append(f"Gate #{idx+1}: 'MEASURE' must be last")

            self._validate_target(gate, idx)
            if 'control' in gate and gate['control'] is not None:
                self._validate_control(gate, idx)
                tgt = gate.get('target', [])
                ctrl = gate.get('control')
                if isinstance(ctrl, list) and isinstance(tgt, list):
                    overlap = set(ctrl) & set(tgt)
                    if overlap:
                        self.validation_errors.append(f"Gate #{idx+1}: control and target overlap: {overlap}")

            self._validate_params(gate, idx, parameters)

            ts = gate['timeStep']
            if not isinstance(ts, int) or ts < 0:
                self.validation_errors.append(f"Gate #{idx+1}: invalid 'timeStep'")

    def _validate_target(self, gate: Dict, idx: int) -> None:
        target = gate.get('target')
        if not isinstance(target, list) or not target:
            self.validation_errors.append(f"Gate #{idx+1}: invalid 'target'")
            return
        for t in target:
            if not isinstance(t, int) or t < 0:
                self.validation_errors.append(f"Gate #{idx+1}: invalid target qubit {t}")

    def _validate_control(self, gate: Dict, idx: int) -> None:
        control = gate.get('control')
        gate_type = gate.get('type')
        if not isinstance(control, list):
            self.validation_errors.append(f"Gate #{idx+1}: 'control' must be a list")
            return
        if gate_type not in self.CONTROLLED_GATES:
            self.validation_errors.append(f"Gate #{idx+1}: 'control' not allowed for {gate_type}")
            return
        for c in control:
            if not isinstance(c, int) or c < 0:
                self.validation_errors.append(f"Gate #{idx+1}: invalid control qubit {c}")

    def _validate_params(self, gate: Dict, idx: int, parameters: List[str]) -> None:
        gate_type = gate.get('type')
        params = gate.get('params', [])
        if gate_type in self.PARAMETERIZED_GATES:
            if not isinstance(params, list) or not params:
                self.validation_errors.append(f"Gate #{idx+1}: invalid or missing 'params'")
                return
            for j, p in enumerate(params):
                if isinstance(p, (int, float)):
                    if abs(p) > 6.2832:
                        self.validation_errors.append(f"Gate #{idx+1}: param {p} out of range")
                elif isinstance(p, str):
                    if p not in parameters:
                        self.validation_errors.append(f"Gate #{idx+1}: unknown parameter '{p}'")
                else:
                    self.validation_errors.append(f"Gate #{idx+1}: invalid param type")
        elif 'params' in gate and params:
            self.validation_errors.append(f"Gate #{idx+1}: 'params' not allowed for {gate_type}")

    def _validate_time_conflicts(self) -> None:
        circuit = self.circuit_data.get('circuit', [])
        time_qubit_map: Dict[int, set] = {}
        for idx, gate in enumerate(circuit):
            ts = gate.get('timeStep')
            if not isinstance(ts, int):
                continue
            active = set(gate.get('target', []))
            ctrl = gate.get('control')
            if isinstance(ctrl, list):
                active.update(ctrl)
            if ts not in time_qubit_map:
                time_qubit_map[ts] = set()
            conflicts = active & time_qubit_map[ts]
            if conflicts:
                self.validation_errors.append(f"Gate #{idx+1}: time conflict at step {ts} on qubits {sorted(list(conflicts))}")
            time_qubit_map[ts].update(active)

def validate_quantum_circuit_from_file(file_path: str) -> Dict[str, Union[bool, List[str]]]:
    validator = QuantumCircuitValidator()
    is_valid = validator.validate_from_file(file_path)
    return {'valid': is_valid, 'errors': validator.get_errors()}

def validate_quantum_circuit_from_dict(circuit_data: dict) -> Dict[str, Union[bool, List[str]]]:
    validator = QuantumCircuitValidator()
    is_valid = validator.validate(circuit_data)
    return {'valid': is_valid, 'errors': validator.get_errors()}

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = validate_quantum_circuit_from_file(sys.argv[1])
        if result['valid']:
            print("Validation passed!")
        else:
            print("Validation failed! Errors:")
            for err in result['errors']:
                print(f"- {err}")
    else:
        print("Usage: python quantum_validator.py <path_to_json_file>")
