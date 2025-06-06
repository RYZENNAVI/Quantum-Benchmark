import unittest
import json
from quantum_validator import QuantumCircuitValidator, validate_quantum_circuit
import os
# Usage: python test_validator.py

class TestQuantumCircuitValidator(unittest.TestCase):
    """Test suite for Quantum Circuit Validator"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.validator = QuantumCircuitValidator()
        
        # Create test data directory
        os.makedirs('test_data', exist_ok=True)
        
        # Valid quantum circuit data
        self.valid_circuit = {
            "qubits": 5,
            "gates": [
                {
                    "id": "g1",
                    "type": "RY",
                    "target": [0],
                    "params": ["theta_1"],
                    "timeStep": 0
                },
                {
                    "id": "g2",
                    "type": "CNOT",
                    "target": [1],
                    "control": 0,
                    "timeStep": 1
                },
                {
                    "id": "g3",
                    "type": "RZ",
                    "target": [1],
                    "params": [0.33],
                    "timeStep": 2
                }
            ]
        }
        
        # Save valid circuit data to file
        with open('test_data/valid_circuit.json', 'w') as f:
            json.dump(self.valid_circuit, f, indent=2)
    
    def tearDown(self):
        """Clean up test fixtures"""
        # Remove test data file
        if os.path.exists('test_data/valid_circuit.json'):
            os.remove('test_data/valid_circuit.json')
        
        # Try to remove test data directory
        try:
            os.rmdir('test_data')
        except OSError:
            pass  # Directory might not be empty, ignore error
    
    def test_valid_circuit(self):
        """Test validation of valid quantum circuit data"""
        # Test dictionary validation
        is_valid = self.validator.validate(self.valid_circuit)
        self.assertTrue(is_valid)
        self.assertEqual(len(self.validator.get_errors()), 0)
        
        # Test file validation
        is_valid = self.validator.validate_from_file('test_data/valid_circuit.json')
        self.assertTrue(is_valid)
        self.assertEqual(len(self.validator.get_errors()), 0)
        
        # Test convenience function
        result = validate_quantum_circuit('test_data/valid_circuit.json')
        self.assertTrue(result['valid'])
        self.assertEqual(len(result['errors']), 0)
    
    def test_missing_fields(self):
        """Test validation of circuits with missing required fields"""
        # Missing qubits field
        circuit = {"gates": self.valid_circuit["gates"]}
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Missing required field: 'qubits'", self.validator.get_errors())
        
        # Missing gates field
        circuit = {"qubits": self.valid_circuit["qubits"]}
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Missing required field: 'gates'", self.validator.get_errors())
        
        # Gate missing required field
        circuit = {
            "qubits": 5,
            "gates": [
                {
                    "id": "g1",
                    "type": "RY",
                    # Missing target field
                    "params": ["theta_1"],
                    "timeStep": 0
                }
            ]
        }
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #1 missing required field: 'target'", self.validator.get_errors())
    
    def test_invalid_types(self):
        """Test validation of circuits with invalid data types"""
        # qubits is not an integer
        circuit = dict(self.valid_circuit)
        circuit["qubits"] = "5"  # String instead of integer
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("'qubits' must be an integer", self.validator.get_errors())
        
        # qubits is not positive
        circuit = dict(self.valid_circuit)
        circuit["qubits"] = 0  # Zero instead of positive integer
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("'qubits' must be a positive integer", self.validator.get_errors())
        
        # gates is not an array
        circuit = dict(self.valid_circuit)
        circuit["gates"] = {}  # Object instead of array
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("'gates' must be an array", self.validator.get_errors())
        
        # target is not an array
        circuit = dict(self.valid_circuit)
        circuit["gates"][0]["target"] = 0  # Integer instead of array
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #1: 'target' must be an array", self.validator.get_errors())
    
    def test_invalid_gate_type(self):
        """Test validation of circuits with invalid gate types"""
        circuit = dict(self.valid_circuit)
        circuit["gates"][0]["type"] = "INVALID_TYPE"  # Unsupported gate type
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #1: Unsupported gate type 'INVALID_TYPE'", self.validator.get_errors())
    
    def test_qubit_range(self):
        """Test validation of qubit range"""
        # target out of range
        circuit = dict(self.valid_circuit)
        circuit["gates"][0]["target"] = [5]  # Out of range [0, 4]
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #1: Target qubit 5 is out of range [0, 4]", self.validator.get_errors())
        
        # control out of range
        circuit = dict(self.valid_circuit)
        circuit["gates"][1]["control"] = 5  # Out of range [0, 4]
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #2: Control qubit 5 is out of range [0, 4]", self.validator.get_errors())
    
    def test_control_target_conflict(self):
        """Test validation of control and target qubit conflicts"""
        circuit = dict(self.valid_circuit)
        circuit["gates"][1]["target"] = [0]  # Conflicts with control=0
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #2: Control and target qubits cannot be the same: 0", self.validator.get_errors())
    
    def test_params_validation(self):
        """Test validation of gate parameters"""
        # Required params missing
        circuit = dict(self.valid_circuit)
        del circuit["gates"][0]["params"]  # RY gate requires params
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #1: Gate type 'RY' requires 'params' field", self.validator.get_errors())
        
        # Param out of range
        circuit = dict(self.valid_circuit)
        circuit["gates"][2]["params"] = [10.0]  # Out of range [-6.2832, 6.2832]
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #3: 'params[0]' value 10.0 is out of range [-6.2832, 6.2832]", self.validator.get_errors())
        
        # Params provided for gate that doesn't need them
        circuit = dict(self.valid_circuit)
        circuit["gates"][1]["params"] = [0.5]  # CNOT gate doesn't need params
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #2: Gate type 'CNOT' does not support 'params' field", self.validator.get_errors())
    
    def test_time_conflicts(self):
        """Test validation of time conflicts between gates"""
        circuit = dict(self.valid_circuit)
        # Add a gate that conflicts with an existing gate
        circuit["gates"].append({
            "id": "g4",
            "type": "H",
            "target": [1],  # Conflicts with g3 at timeStep 2
            "timeStep": 2
        })
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #4: Time conflict at step 2 on qubits {1}", self.validator.get_errors())
    
    def test_duplicate_gate_id(self):
        """Test duplicate gate ID"""
        circuit = dict(self.valid_circuit)
        # Add a gate with the same ID as g1
        circuit["gates"].append({
            "id": "g1",  # Duplicate ID
            "type": "X",
            "target": [2],
            "timeStep": 3
        })
        is_valid = self.validator.validate(circuit)
        self.assertFalse(is_valid)
        self.assertIn("Gate #4: 'id' 'g1' is not unique", self.validator.get_errors())
    
    def test_invalid_file_path(self):
        """Test invalid file path"""
        is_valid = self.validator.validate_from_file('non_existent_file.json')
        self.assertFalse(is_valid)
        self.assertIn("File not exists", self.validator.get_errors()[0])
    
    def test_invalid_json_string(self):
        """Test invalid JSON string"""
        is_valid = self.validator.validate_from_string("invalid json")
        self.assertFalse(is_valid)
        self.assertIn("JSON parse error", self.validator.get_errors()[0])


if __name__ == "__main__":
    unittest.main()