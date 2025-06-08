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


def test_post_encoding(data):
    resp = requests.post(f"{BASE_URL}/encoding", json=data)
    try:
        result = resp.json()
    except Exception:
        result = resp.text
    print(f"POST /encoding -> status {resp.status_code}: {result}")
    return result, resp


def test_send_to_worker(encoding_id):
    resp = requests.post(f"{BASE_URL}/encode", params={"encoding_id": encoding_id})
    print(f"POST /encode?encoding_id={encoding_id} -> status {resp.status_code}: {resp.text}")


def list_encodings():
    resp = requests.get(f"{BASE_URL}/encoding")
    print(f"GET /encoding -> status {resp.status_code}")
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    print(data)
    return data


def run_tests():
    print("Testing valid circuits...")
    for name in ["valid_circuit1.json", "valid_circuit2.json", "valid_circuit3.json"]:
        data = load_example(name)
        test_post_encoding(data)

    print("Testing invalid circuit...")
    invalid = load_example("invalid_circuit.json")
    test_post_encoding(invalid)

    print("Listing encodings...")
    encodings = list_encodings()

    if isinstance(encodings, list) and encodings:
        obj_id = encodings[0].get("_id")
        if obj_id:
            print(f"Testing get/update/delete for {obj_id}...")
            resp = requests.get(f"{BASE_URL}/encoding/{obj_id}")
            print(f"GET /encoding/{{id}} -> status {resp.status_code}: {resp.text}")

            # Send update with same data
            resp = requests.put(f"{BASE_URL}/encoding/{obj_id}", json=encodings[0]["circuit"])
            print(f"PUT /encoding/{{id}} -> status {resp.status_code}: {resp.text}")

            resp = requests.delete(f"{BASE_URL}/encoding/{obj_id}")
            print(f"DELETE /encoding/{{id}} -> status {resp.status_code}: {resp.text}")

    print("Testing send to worker...")
    test_send_to_worker(1)
    test_send_to_worker("invalid")


if __name__ == "__main__":
    run_tests()
