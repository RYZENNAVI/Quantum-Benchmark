# Reference Data JSON Validation Rules

**Version**: 1.0  
**Filename**: `dataset/validation_rules.md`

---

## 1. Top-Level Structure Requirements

The JSON document **must** be an object containing **exactly three** required properties:

- **`encodings`**  
  - Type: object  
  - Required.  
  - Keys: encoding IDs as strings representing positive integers.  
  - Values: `EncodingInfo` objects.  

- **`ansaetze`**  
  - Type: object  
  - Required.  
  - Keys: ansatz IDs as strings representing positive integers.  
  - Values: `AnsatzInfo` objects.  

- **`data`**  
  - Type: object  
  - Required.  
  - Keys: dataset IDs as strings representing positive integers.  
  - Values: `DatasetInfo` objects.  

Each of these three sections **must** contain at least one entry and no additional top-level properties are allowed.

---

## 2. `EncodingInfo` Object Requirements

Each value in `encodings` must be an object with all of the following fields:

| Field         | Type      | Required | Constraints                                                                 |
|---------------|-----------|----------|----------------------------------------------------------------------------|
| `depth`       | integer   | Yes      | Must be ≥ 0.                                                                 |
| `name`        | string    | Yes      | Non-empty.                                                                   |
| `description` | string    | Yes      | Non-empty.                                                                   |
| `circuit`     | object    | Yes      | Must conform to the Quantum Circuit JSON schema in `quantum_circuit_validation_rules.md`. |

---

## 3. `AnsatzInfo` Object Requirements

The rules for each value in `ansaetze` are **identical** to `EncodingInfo`.

---

## 4. `DatasetInfo` Object Requirements

Each value in `data` must include:

| Field         | Type      | Required | Constraints                               |
|---------------|-----------|----------|-------------------------------------------|
| `depth`       | integer   | Yes      | Must be ≥ 0.                              |
| `name`        | string    | Yes      | Non-empty.                                |
| `description` | string    | Yes      | Non-empty.                                |

> **Note:** Unlike `EncodingInfo` and `AnsatzInfo`, `DatasetInfo` **must not** include a `circuit` field.

---

## 5. Error Handling

Validation **must** fail with clear, descriptive error messages when:

- A required top-level property is missing.
- An ID key is not a string representing a positive integer.
- A required field within an object is missing or of the wrong type.
- A field value violates its constraints (e.g., negative `depth`).
- Any additional, undefined properties are present.

---

## 6. Examples

```json
{
  "encodings": {
    "1": {
      "depth": 2,
      "name": "Encoding Alpha",
      "description": "A simple encoding example.",
      "circuit": { "gates": [] }
    }
  },
  "ansaetze": {
    "1": {
      "depth": 3,
      "name": "Ansatz Beta",
      "description": "Basic ansatz structure.",
      "circuit": { "gates": [] }
    }
  },
  "data": {
    "1": {
      "depth": 1,
      "name": "Dataset Gamma",
      "description": "Example dataset without a circuit."
    }
  }
}
```