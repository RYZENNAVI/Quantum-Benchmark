# Resource Fetch Request JSON Validation Rules

**Version**: 1.0  
**Filename**: `resources/resources_rules.md`

---

## 1. Top-Level Structure

A valid Resource-Fetch request **must** be a JSON object. All properties are optional except where explicitly noted.

| Property        | Type    | Required | Description                                         |
|-----------------|---------|----------|-----------------------------------------------------|
| `encoding_ids`  | array   | No       | List of encoding ID **strings**.                    |
| `ansatz_ids`    | array   | No       | List of ansatz ID **strings**.                      |
| `dataset_ids`   | array   | No       | List of dataset ID **strings**.                     |
| `full`          | boolean | No       | `true` → return full objects; `false` → return only a short description. Defaults to `false`.

> **Note** At least **one** of the three ID arrays **must** be provided; otherwise the request is meaningless.

---

## 2. ID Array Rules

* Each element in an ID array **must** be a non-empty string representing a positive integer (e.g. `"3"`).
* Duplicate IDs are allowed but the API will de-duplicate internally.

---

## 3. `full` Flag Behaviour

* `false` (default) ➜ The response returns **only** `name`, `description` and `depth` for each requested resource.
* `true` ➜ The entire resource object, including `circuit` or other nested data, is returned.

---

## 4. Error Handling

The API will respond with **HTTP 422** (validation error) when:

1. Any ID value is **not** a string.
2. The `full` property is **not** a boolean.
3. The request object contains additional, undefined properties.
4. All three ID arrays are omitted or empty.

---

## 5. Examples

### 5.1 Minimal Valid Request
```json
{
  "encoding_ids": ["1"]
}
```

### 5.2 Full Data Request
```json
{
  "encoding_ids": ["2", "3"],
  "ansatz_ids": ["5"],
  "dataset_ids": ["10"],
  "full": true
}
```

### 5.3 Invalid Request (Wrong Types)
```json
{
  "encoding_ids": [1, 2],
  "full": "yes"
}
``` 