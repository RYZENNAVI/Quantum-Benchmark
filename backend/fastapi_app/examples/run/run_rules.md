# Run Benchmark Request JSON Validation Rules

**Version**: 1.0  
**Filename**: `run/validation_rules.md`

---

## 1. Top-Level Structure Requirements

The JSON document **must** be an object containing **exactly three** required properties:

| Property      | Type     | Required | Constraints     |
|---------------|----------|----------|-----------------|
| `encoding_id` | integer  | Yes      | > 0             |
| `ansatz_id`   | integer  | Yes      | > 0             |
| `data_id`     | integer  | Yes      | > 0             |

_No additional properties are allowed._

---

## 2. Constraints

1. All three ID properties must be positive integers (`1, 2, 3, …`).
2. IDs must correspond to existing entries in the reference data (`encodings`, `ansaetze`, `data`).
3. Numeric values must not be provided as strings.

---

## 3. Error Handling

Validation **must** fail with clear, descriptive error messages when:

- A required field is missing or is of the wrong type.
- A field value is ≤ 0.
- Any extra, undefined properties are present.

Error responses should include:
```json
{
  "valid": false,
  "errors": [ "Error message 1", "Error message 2" ]
}
```

---

## 4. Example

```json
{
  "encoding_id": 1,
  "ansatz_id": 1,
  "data_id": 1
}
```