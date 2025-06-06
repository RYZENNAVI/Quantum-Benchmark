# Quantum Circuit JSON Validation Rules

**Version**: 2.0  
**Filename**: `quantum_circuit_validation_rules.md`

---

## 1. Top-Level Structure Requirements

The JSON input must be an object with the following fields:

- **`circuit`**
  - Required.
  - Must be a list of gate objects.
  - Must contain at least one gate.

- **`parameters`**
  - Required.
  - Must be a list of strings.
  - Each string represents a symbolic parameter that may be used in gate definitions.

- **`inputs`**
  - Required.
  - Must be a list of strings.
  - Each string represents an input name (e.g., user-defined variable names).

---

## 2. Gate Entry Requirements

Each item in the `circuit` list must be a dictionary representing a quantum gate and must include the following fields:

- **`id`**
  - Required.
  - A unique string identifier for the gate.

- **`type`**
  - Required.
  - A string specifying the gate type.
  - Must be one of the following:
    - `H`, `X`, `Y`, `Z`, `RX`, `RY`, `RZ`, `CNOT`, `CZ`, `SWAP`, `MEASURE`

- **`target`**
  - Required.
  - A non-empty list of integers.
  - Each integer represents a qubit index (must be non-negative).

- **`timeStep`**
  - Required.
  - A non-negative integer indicating when the gate is applied.

---

## 3. Control Qubit Validation

- The optional **`control`** field is only allowed for the following gate types:
  - `CNOT`, `CZ`

- Rules:
  - Must be a list of integers (qubit indices).
  - Control qubits must be non-negative.
  - The list of control qubits must not overlap with the target qubits of the same gate.

---

## 4. Parameter Validation

- Only the following gate types may include a **`params`** field:
  - `RX`, `RY`, `RZ`

- Rules for `params`:
  - Must be a non-empty list.
  - Each element must be either:
    - A numeric value within the range `[-6.2832, 6.2832]`, or
    - A string that appears in the top-level `parameters` list.

- For all other gate types:
  - The `params` field must be omitted or empty.

---

## 5. Special Rules for the `MEASURE` Gate

- The gate type `MEASURE` is used to represent measurement of qubits.
- It must be the **last** gate in the `circuit` list.
- Measurement gates follow the same format as other gates but usually do not have `params` or `control` fields.

---

## 6. Time Conflict Check

- No two gates may operate on the same qubit at the same `timeStep`.
- Both `target` and `control` qubits are included in the conflict check.

---

## 7. Error Handling

Validation will fail and descriptive error messages will be returned if:

- The input is not a valid JSON file.
- Required fields are missing or have incorrect types.
- Invalid gate types or parameters are used.
- TimeStep conflicts or illegal control/target configurations are found.

---

## Example Command Line Usage

```bash
python quantum_validator.py ./example/valid_circuit1.json
python quantum_validator.py ./example/invalid_circuit.json
