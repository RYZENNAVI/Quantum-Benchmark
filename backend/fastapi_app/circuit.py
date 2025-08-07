from dataclasses import dataclass
from re          import match


#
#   Circuit structure.
#
Parameter = str | int | float

@dataclass
class Gate:
    gate:   str
    wires:  list[int]
    params: list[Parameter]

Circuit = list[Gate]


#
#   Gate names.
#
gate_names_by_param_count: dict[int, set[str]] = {
    0: set(['X', 'Y', 'Z', 'H', 'CNOT']),
    1: set(['RX', 'RY', 'RZ']),
}

gate_names_by_wire_count: dict[int, set[str]] = {
    1: set(['X', 'Y', 'Z', 'H', 'RX', 'RY', 'RZ']),
    2: set(['CNOT']),
}

gate_names: set[str] = set([name for row in gate_names_by_param_count.values() for name in row])

param_count_by_gate_name: dict[str, int] = {
        name: param_count
        for param_count, names in gate_names_by_param_count.items()
        for name in names
}

wire_count_by_gate_name: dict[str, int] = {
        name: wire_count 
        for wire_count, names in gate_names_by_wire_count.items()
        for name in names
}

param_input_index_pattern = r'^input_(\d+)$'


#
#   Error messages.
#
def err_gate_not_supported(gate_index: int) -> str:
    return f'Gate is not recognized or not supported yet ({gate_index = }).'

def err_gate_param_count_wrong(gate_index: int, expected: int) -> str:
    return f'Gate expected {expected} parameters ({gate_index = }).'

def err_gate_wire_count_wrong(gate_index: int, expected: int) -> str:
    return f'Gate expected {expected} wires ({gate_index = }).'

def err_wire_negative(gate_index: int, wire_index: int) -> str:
    return f'Wire index can not be negative ({gate_index = }, {wire_index = }).'

def err_param_not_input_index(gate_index: int, param_index: int) -> str:
    return f'String parameter does not match the input index pattern ({gate_index = }, {param_index = }).'

def err_wire_exceeds_qubit_count(gate_index: int, wire_index: int) -> str:
    return f'Wire index can not exceed the qubit count ({gate_index = }, {wire_index = }).'

def err_param_input_index_negative(gate_index: int, param_index: int) -> str:
    return f'Parameter input index can not be negative ({gate_index = }, {param_index = }).'

def err_circuit_empty() -> str:
    return 'Circuit can not be empty.'

def err_param_input_pattern_mismatch(gate_index: int, param_index: int) -> str:
    return f'Parameter of type string has to match the input index pattern ({gate_index}, {param_index}).'

 

#
#   Circuit methods.
#
def validate_circuit(circuit: Circuit, qubit_count: int | None = None) -> list[str] | None:
    err = []

    if len(circuit) == 0:
        err.append(err_circuit_empty())

    for gate_index, gate in enumerate(circuit):
        if gate.gate in gate_names:
            expected_param_count = param_count_by_gate_name[gate.gate]
            expected_wire_count  = wire_count_by_gate_name[gate.gate]

            if len(gate.params) != expected_param_count:
                err.append(err_gate_param_count_wrong(gate_index, expected_param_count))

            if len(gate.wires) != expected_wire_count:
                err.append(err_gate_wire_count_wrong(gate_index, expected_wire_count))
        else:
            err.append(err_gate_not_supported(gate_index))
            continue


        for param_index, param in enumerate(gate.params):
            if isinstance(param, str):
                if not match(param_input_index_pattern, param):
                    err.append(err_param_not_input_index(gate_index, param_index))

                matching = match(param_input_index_pattern, param)

                if matching:
                    input_index = int(matching.group(1))

                    if input_index < 0:
                        err.append(err_param_input_index_negative(gate_index, param_index))
                else:
                    err.append(err_param_input_pattern_mismatch(gate_index, param_index))

        for wire_index, wire in enumerate(gate.wires):
            if wire < 0:
                err.append(err_wire_negative(gate_index, wire_index))

            if (qubit_count is not None) and (wire >= qubit_count):
                err.append(err_wire_exceeds_qubit_count(gate_index, wire_index))

    return err if len(err) > 0 else None


def calculate_circuit_depth(circuit: Circuit) -> int:
    if not circuit:
        return 0

    qubit_depth = {}

    for gate in circuit:
        max_qubit_depth = 0

        for wire_index in gate.wires:
            if wire_index in qubit_depth:
                max_qubit_depth = max(qubit_depth[wire_index], max_qubit_depth)
            
        new_qubit_depth = max_qubit_depth + 1
        
        for wire_index in gate.wires:
            qubit_depth[wire_index] = new_qubit_depth
    
    return max(qubit_depth.values())


def calculate_qubit_count(circuit: Circuit) -> int:
    max_wire = -1

    for gate in circuit:
        max_wire = max(max_wire, *gate.wires)

    qubit_count = max_wire + 1
    return qubit_count
