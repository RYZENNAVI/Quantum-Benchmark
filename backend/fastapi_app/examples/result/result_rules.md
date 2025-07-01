# Benchmark Result JSON Validation Rules

**Version**: 1.0  
**Filename**: `result/validation_rules.md`

---

## 1. Top-Level Structure Requirements

Benchmark results can be represented in two formats:

1. **Single Result** (`BenchmarkResult`)  
2. **Batch Response** (`BenchmarkResultResponse`)

### 1.1 `BenchmarkResult` (Single Result)

A `BenchmarkResult` **must** be an object containing **exactly** the following properties:

| Property       | Type     | Required | Constraints            |
|----------------|----------|----------|------------------------|
| `encoding_id`  | integer  | Yes      | > 0                    |
| `ansatz_id`    | integer  | Yes      | > 0                    |
| `data_id`      | integer  | Yes      | > 0                    |
| `loss`         | number   | Yes      | ≥ 0                    |
| `accuracy`     | number   | Yes      | 0 ≤ accuracy ≤ 1       |

_No additional properties are allowed._

### 1.2 `BenchmarkResultResponse` (Batch Response)

A `BenchmarkResultResponse` **must** be an object containing **exactly** these properties:

| Property      | Type    | Required | Description                                                  |
|---------------|---------|----------|--------------------------------------------------------------|
| `results`     | array   | Yes      | Array of one or more `BenchmarkResult` objects.              |
| `encodings`   | object  | Yes      | Keys: encoding IDs as strings; Values: `EncodingResultInfo`. |
| `ansaetze`    | object  | Yes      | Keys: ansatz IDs as strings; Values: `AnsatzResultInfo`.     |

#### `EncodingResultInfo` / `AnsatzResultInfo`

Each `EncodingResultInfo` or `AnsatzResultInfo` object must include:

| Field         | Type      | Required | Constraints                               |
|---------------|-----------|----------|-------------------------------------------|
| `depth`       | integer   | Yes      | ≥ 0                                       |
| `name`        | string    | Yes      | Non-empty                                 |
| `description` | string    | Yes      | Non-empty                                 |

---

## 2. Error Handling

Validation **must** fail with clear, descriptive error messages when:

- A required property is missing.
- A property has the incorrect type.
- A numeric value is out of range.
- Any additional, undefined properties are present.

---

## 3. Examples

#### Single Result

```json
{
  "encoding_id": 1,
  "ansatz_id": 2,
  "data_id": 3,
  "loss": 0.12,
  "accuracy": 0.95
}
```

#### Batch Response

```json
{
  "results": [
    { "encoding_id": 1, "ansatz_id": 2, "data_id": 3, "loss": 0.12, "accuracy": 0.95 }
  ],
  "encodings": {
    "1": { "depth": 2, "name": "Encoding Alpha", "description": "A sample encoding." }
  },
  "ansaetze": {
    "2": { "depth": 3, "name": "Ansatz Beta", "description": "A sample ansatz." }
  }
}
```