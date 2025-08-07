import os
import json
from pathlib import Path
import requests
from typing import Union

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")

# ---------------------------------------------------------------------------
# Example directories
# ---------------------------------------------------------------------------
# After restructuring, the FastAPI backend has been moved under ``backend/``.
# To make the script robust regardless of the working directory, we build the
# paths relative to the current file location instead of the current working
# directory.

_ROOT_DIR = Path(__file__).resolve().parent  # quantum-encoding-benchmark/
_BACKEND_DIR = _ROOT_DIR / "backend" / "fastapi_app"

ENCODING_EXAMPLE_DIR = _BACKEND_DIR / "quantum_validator" / "example"
DATASET_EXAMPLE_DIR = _BACKEND_DIR / "examples" / "dataset"
RUN_EXAMPLE_DIR = _BACKEND_DIR / "examples" / "run"
RESULT_EXAMPLE_DIR = _BACKEND_DIR / "examples" / "result"


def load_example(directory: Union[Path, str], name: str):
    """Load an example JSON file and return its parsed content."""
    path = Path(directory) / name
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def pretty_print(title, status, result):
    print(f"\n{title}")
    print(f"Status: {status}")
    if isinstance(result, dict):
        print("Response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Response: {result}")


def test_post_encoding(data, name):
    resp = requests.post(f"{BASE_URL}/encoding", json=data)
    try:
        result = resp.json()
    except Exception:
        result = resp.text
    pretty_print(f"POST /encoding [{name}]", resp.status_code, result)
    return result, resp


def test_post_dataset(data, name):
    resp = requests.post(f"{BASE_URL}/dataset", json=data)
    try:
        result = resp.json()
    except Exception:
        result = resp.text
    pretty_print(f"POST /dataset [{name}]", resp.status_code, result)
    return result, resp


def test_post_run(data, name):
    resp = requests.post(f"{BASE_URL}/run", json=data)
    try:
        result = resp.json()
    except Exception:
        result = resp.text
    pretty_print(f"POST /run [{name}]", resp.status_code, result)
    return result, resp


def test_post_result(data, name):
    resp = requests.post(f"{BASE_URL}/result", json=data)
    try:
        result = resp.json()
    except Exception:
        result = resp.text
    pretty_print(f"POST /result [{name}]", resp.status_code, result)
    return result, resp


def test_send_to_worker(encoding_id):
    resp = requests.post(f"{BASE_URL}/encode", params={"encoding_id": encoding_id})
    pretty_print(f"POST /encode?encoding_id={encoding_id}", resp.status_code, resp.text)


def list_encodings():
    resp = requests.get(f"{BASE_URL}/encoding")
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    pretty_print("GET /encoding", resp.status_code, data)
    return data


def list_datasets():
    resp = requests.get(f"{BASE_URL}/dataset")
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    pretty_print("GET /dataset", resp.status_code, data)
    return data


def list_runs():
    resp = requests.get(f"{BASE_URL}/run")
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    pretty_print("GET /run", resp.status_code, data)
    return data


def list_results():
    resp = requests.get(f"{BASE_URL}/result")
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    pretty_print("GET /result", resp.status_code, data)
    return data


def int_to_object_id(value: int) -> str:
    return hex(value)[2:].rjust(24, "0")


def run_tests():
    print("========== Running API Tests ==========")

    print("\nTesting valid circuits...")
    for name in ["valid_circuit1.json", "valid_circuit2.json", "valid_circuit3.json"]:
        data = load_example(ENCODING_EXAMPLE_DIR, name)
        test_post_encoding(data, name)

    print("\nTesting invalid circuit...")
    invalid = load_example(ENCODING_EXAMPLE_DIR, "invalid_circuit.json")
    test_post_encoding(invalid, "invalid_circuit.json")

    print("\nListing encodings...")
    encodings = list_encodings()

    if isinstance(encodings, list) and encodings:
        obj_id = encodings[0].get("_id")
        if obj_id:
            print(f"\nTesting get/update/delete for encoding ID: {obj_id}...")

            # GET
            resp = requests.get(f"{BASE_URL}/encoding/{obj_id}")
            pretty_print(f"GET /encoding/{obj_id}", resp.status_code, resp.text)

            # PUT (send same data again)
            resp = requests.put(
                f"{BASE_URL}/encoding/{obj_id}", json=encodings[0]["circuit"]
            )
            pretty_print(f"PUT /encoding/{obj_id}", resp.status_code, resp.text)

            # DELETE
            resp = requests.delete(f"{BASE_URL}/encoding/{obj_id}")
            pretty_print(f"DELETE /encoding/{obj_id}", resp.status_code, resp.text)

    print("\nTesting send to worker...")
    test_send_to_worker(1)
    test_send_to_worker("invalid")

    # ==== Dataset API ====
    dataset_ids = []
    print("\nTesting valid dataset payloads...")
    for name in ["valid_dataset1.json", "valid_dataset2.json", "valid_dataset3.json"]:
        data = load_example(DATASET_EXAMPLE_DIR, name)
        result, resp = test_post_dataset(data, name)
        if isinstance(result, dict) and "id" in result:
            dataset_ids.append(result["id"])

    print("\nTesting invalid dataset payload...")
    invalid_dataset = load_example(DATASET_EXAMPLE_DIR, "invalid_dataset.json")
    test_post_dataset(invalid_dataset, "invalid_dataset.json")

    print("\nListing datasets...")
    list_datasets()

    # ==== Run API ====
    run_ids = []
    print("\nTesting valid run requests...")
    for name in ["valid_run1.json", "valid_run2.json", "valid_run3.json", "valid_multi_run.json"]:
        data = load_example(RUN_EXAMPLE_DIR, name)
        result, resp = test_post_run(data, name)
        if isinstance(result, dict) and "id" in result:
            try:
                run_ids.append(int_to_object_id(int(result["id"])))
            except Exception:
                # For multi-run, id may already be an ObjectId-like string
                run_ids.append(result["id"])

    print("\nTesting invalid run request...")
    for name in ["invalid_run.json", "invalid_multi_run.json"]:
        data = load_example(RUN_EXAMPLE_DIR, name)
        test_post_run(data, name)

    print("\nListing runs...")
    list_runs()

    # ==== Result API ====
    result_ids = []
    print("\nTesting valid benchmark results...")
    for name in ["valid_result1.json", "valid_result2.json", "valid_result3.json"]:
        data = load_example(RESULT_EXAMPLE_DIR, name)
        result, resp = test_post_result(data, name)
        if isinstance(result, dict) and "id" in result:
            result_ids.append(result["id"])

    print("\nTesting invalid benchmark result...")
    invalid_res = load_example(RESULT_EXAMPLE_DIR, "invalid_result.json")
    test_post_result(invalid_res, "invalid_result.json")

    print("\nListing results...")
    list_results()

    # ==== Cleanup ====
    print("\nCleaning up: deleting all encodings via API...")
    # ---- Comprehensive cleanup: fetch fresh lists and delete every entry ----
    for endpoint in ["encoding", "dataset", "run", "result"]:
        try:
            items = requests.get(f"{BASE_URL}/{endpoint}").json()
        except Exception:
            items = []
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            obj_id = item.get("_id")
            if not obj_id:
                continue
            resp = requests.delete(f"{BASE_URL}/{endpoint}/{obj_id}")
            print(f"  - Deleted {endpoint} {obj_id} -> status {resp.status_code}")

    print("\nAll tests completed.\n")


if __name__ == "__main__":
    run_tests()
