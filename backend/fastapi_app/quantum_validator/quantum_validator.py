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
        self._validate_and_set_qubits(all_qubit_indices)
        if self.validation_errors:
            return False

        self._validate_gates(all_qubit_indices)

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
        if 'qubits' in self.circuit_data:
            qubits_val = self.circuit_data['qubits']
            if not isinstance(qubits_val, int) or qubits_val <= 0:
                self.validation_errors.append("'qubits' must be a positive integer")

    def _collect_all_qubit_indices(self) -> List[int]:
        indices = []
        circuit = self.circuit_data.get('circuit', [])
        for gate in circuit:
            # Derive qubit count solely from the explicit *wires* list.
            # Control qubits are ignored for this calculation because they do
            # not introduce new wires; they must refer to existing ones.
            tgt = gate.get('wires', [])
            if isinstance(tgt, list):
                indices.extend([t for t in tgt if isinstance(t, int)])
        return indices

    def _validate_and_set_qubits(self, all_qubit_indices: List[int]) -> None:
        """Validate the top-level ``qubits`` field and populate it if missing.

        Logic:
        1.  Determine the highest index present in **wires** across all gates. (Control
            qubits are *not* considered because they must already refer to existing
            wires.)  If the circuit is empty we treat the maximum index as ``-1``.
        2.  The inferred qubit count is therefore ``derived_qubits = max_wire + 1``.
        3.  If the user explicitly provides a ``qubits`` value it must match
            ``derived_qubits``.
        4.  Regardless of how ``qubits`` is obtained, it **must** equal the number of
            classical ``inputs``.
        """
        inputs = self.circuit_data.get('inputs', [])
        provided_qubits = self.circuit_data.get('qubits')

        if all_qubit_indices:
            derived_qubits = max(all_qubit_indices) + 1
        else:
            derived_qubits = len(inputs)

        if provided_qubits is not None:
            if provided_qubits != derived_qubits:
                self.validation_errors.append(
                    f"'qubits' ({provided_qubits}) inconsistent with wires+1 ({derived_qubits})")
            final_qubits = provided_qubits
        else:
            self.circuit_data['qubits'] = derived_qubits
            final_qubits = derived_qubits

        if len(inputs) != final_qubits:
            self.validation_errors.append(
                f"'qubits' ({final_qubits}) must equal number of 'inputs' ({len(inputs)})")

    def _validate_gates(self, all_qubit_indices: List[int]) -> None:
        circuit = self.circuit_data.get('circuit', [])
        parameters = self.circuit_data.get('parameters', [])
        last_index = len(circuit) - 1

        for idx, gate in enumerate(circuit):
            if not isinstance(gate, dict):
                self.validation_errors.append(f"Gate #{idx+1} must be a dict")
                continue

            for field in ['gate', 'wires']:
                if field not in gate:
                    self.validation_errors.append(f"Gate #{idx+1} missing '{field}'")
            if any(field not in gate for field in ['gate', 'wires']):
                continue

            gate_type = gate['gate']
            if gate_type not in self.SUPPORTED_GATE_TYPES:
                self.validation_errors.append(f"Gate #{idx+1}: unsupported 'gate' {gate_type}")
            if gate_type == 'MEASURE' and idx != last_index:
                self.validation_errors.append(f"Gate #{idx+1}: 'MEASURE' must be last")

            self._validate_target(gate, idx)
            if 'control' in gate and gate['control'] is not None:
                self._validate_control(gate, idx)
                tgt = gate.get('wires', [])
                ctrl = gate.get('control')
                if isinstance(ctrl, list) and isinstance(tgt, list):
                    overlap = set(ctrl) & set(tgt)
                    if overlap:
                        self.validation_errors.append(f"Gate #{idx+1}: control and wires overlap: {overlap}")

            self._validate_params(gate, idx, parameters)

    def _validate_target(self, gate: Dict, idx: int) -> None:
        target = gate.get('wires')
        if not isinstance(target, list) or not target:
            self.validation_errors.append(f"Gate #{idx+1}: invalid 'wires'")
            return
        for t in target:
            if not isinstance(t, int) or t < 0:
                self.validation_errors.append(f"Gate #{idx+1}: invalid wire index {t}")

    def _validate_control(self, gate: Dict, idx: int) -> None:
        control = gate.get('control')
        gate_type = gate.get('gate')
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
        gate_type = gate.get('gate')
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
        """Deprecated: retained for backward compatibility."""
        # The new circuit format does not include explicit time steps.
        # Gates are assumed to execute sequentially according to their
        # position in the list, so there is no additional time conflict
        # validation required.
        return

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
