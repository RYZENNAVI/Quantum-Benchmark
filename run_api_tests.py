import os
import json
import time
import requests

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")
EXAMPLE_DIR = os.path.join("FastAPI_app", "quantum_validator", "example")


def load_example(name):
    path = os.path.join(EXAMPLE_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def pretty_print(title, status, result):
    print(f"\n🧪 {title}")
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


def run_tests():
    print("========== Running API Tests ==========")

    print("\n🟢 Testing valid circuits...")
    for name in ["valid_circuit1.json", "valid_circuit2.json", "valid_circuit3.json"]:
        data = load_example(name)
        test_post_encoding(data, name)

    print("\n🔴 Testing invalid circuit...")
    invalid = load_example("invalid_circuit.json")
    test_post_encoding(invalid, "invalid_circuit.json")

    print("\n📋 Listing encodings...")
    encodings = list_encodings()

    if isinstance(encodings, list) and encodings:
        obj_id = encodings[0].get("_id")
        if obj_id:
            print(f"\n🔁 Testing get/update/delete for encoding ID: {obj_id}...")

            # GET
            resp = requests.get(f"{BASE_URL}/encoding/{obj_id}")
            pretty_print(f"GET /encoding/{obj_id}", resp.status_code, resp.text)

            # PUT (send same data again)
            resp = requests.put(f"{BASE_URL}/encoding/{obj_id}", json=encodings[0]["circuit"])
            pretty_print(f"PUT /encoding/{obj_id}", resp.status_code, resp.text)

            # DELETE
            resp = requests.delete(f"{BASE_URL}/encoding/{obj_id}")
            pretty_print(f"DELETE /encoding/{obj_id}", resp.status_code, resp.text)

    print("\n📤 Testing send to worker...")
    test_send_to_worker(1)
    test_send_to_worker("invalid")

    print("\n🧹 Cleaning up: deleting all encodings...")
    for item in encodings:
        obj_id = item.get("_id")
        if obj_id:
            resp = requests.delete(f"{BASE_URL}/encoding/{obj_id}")
            print(f"  - Deleted {obj_id} -> status {resp.status_code}")

    print("\n✅ All tests completed.\n")


if __name__ == "__main__":
    run_tests()
