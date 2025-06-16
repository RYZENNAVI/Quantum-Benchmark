import os
import json
import requests

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")

ENCODING_EXAMPLE_DIR = os.path.join("FastAPI_app", "quantum_validator", "example")
DATASET_EXAMPLE_DIR = os.path.join("FastAPI_app", "examples", "dataset")
RUN_EXAMPLE_DIR = os.path.join("FastAPI_app", "examples", "run")
RESULT_EXAMPLE_DIR = os.path.join("FastAPI_app", "examples", "result")


def load_example(directory, name):
    path = os.path.join(directory, name)
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
    for name in ["valid_run1.json", "valid_run2.json", "valid_run3.json"]:
        data = load_example(RUN_EXAMPLE_DIR, name)
        result, resp = test_post_run(data, name)
        if isinstance(result, dict) and "id" in result:
            try:
                run_ids.append(int_to_object_id(int(result["id"])))
            except Exception:
                pass

    print("\nTesting invalid run request...")
    invalid_run = load_example(RUN_EXAMPLE_DIR, "invalid_run.json")
    test_post_run(invalid_run, "invalid_run.json")

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
    print("\nCleaning up: deleting all encodings...")
    for item in encodings:
        obj_id = item.get("_id")
        if obj_id:
            resp = requests.delete(f"{BASE_URL}/encoding/{obj_id}")
            print(f"  - Deleted {obj_id} -> status {resp.status_code}")

    print("Cleaning up: deleting all datasets...")
    for did in dataset_ids:
        resp = requests.delete(f"{BASE_URL}/dataset/{did}")
        print(f"  - Deleted {did} -> status {resp.status_code}")

    print("Cleaning up: deleting all runs...")
    for rid in run_ids:
        resp = requests.delete(f"{BASE_URL}/run/{rid}")
        print(f"  - Deleted {rid} -> status {resp.status_code}")

    print("Cleaning up: deleting all results...")
    for rid in result_ids:
        resp = requests.delete(f"{BASE_URL}/result/{rid}")
        print(f"  - Deleted {rid} -> status {resp.status_code}")

    print("\nAll tests completed.\n")


if __name__ == "__main__":
    run_tests()
