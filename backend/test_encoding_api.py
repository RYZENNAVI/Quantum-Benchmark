#!/usr/bin/env python3
import requests
import json

# Test data - correct format
test_circuit_correct = {
    "name": "Test Circuit",
    "circuit": [
        {
            "gate": "H",
            "wires": [0],
            "params": []
        },
        {
            "gate": "CNOT",
            "wires": [0, 1],
            "params": []
        }
    ]
}

# Test data - wrong format (circuit as object instead of array)
test_circuit_wrong = {
    "name": "Test Circuit",
    "circuit": {
        "qubits": 2,
        "gates": [
            {
                "gate": "H",
                "wires": [0],
                "params": []
            }
        ]
    }
}

# Test data - missing required fields
test_circuit_missing = {
    "name": "Test Circuit",
    "circuit": [
        {
            "gate": "H"
            # missing wires and params
        }
    ]
}

def test_encoding_api():
    url = "http://localhost:8000/api/encoding/"
    
    test_cases = [
        ("Correct Format", test_circuit_correct),
        ("Wrong Format (circuit as object)", test_circuit_wrong),
        ("Missing Fields", test_circuit_missing)
    ]
    
    for test_name, test_data in test_cases:
        print(f"\n{'='*50}")
        print(f"Testing: {test_name}")
        print(f"{'='*50}")
        print(f"Payload: {json.dumps(test_data, indent=2)}")
        
        try:
            response = requests.post(url, json=test_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Success!")
                print(f"Response: {response.json()}")
            else:
                print("❌ Error!")
                print(f"Response Text: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_encoding_api() 