import unittest
import json
import os
import sys

sys.path.append(os.path.dirname(__file__))
from quantum_validator import QuantumCircuitValidator

EXAMPLE_DIR = os.path.join(os.path.dirname(__file__), "example")

class TestQuantumCircuitValidator(unittest.TestCase):
    def setUp(self):
        self.validator = QuantumCircuitValidator()

    def _load_example(self, name):
        with open(os.path.join(EXAMPLE_DIR, name), 'r', encoding='utf-8') as f:
            return json.load(f)

    def test_valid_examples(self):
        for name in ("valid_circuit1.json", "valid_circuit2.json", "valid_circuit3.json"):
            data = self._load_example(name)
            self.assertTrue(self.validator.validate(data), msg=f"{name}: {self.validator.get_errors()}")

    def test_invalid_example(self):
        data = self._load_example("invalid_circuit.json")
        self.assertFalse(self.validator.validate(data))
        self.assertGreater(len(self.validator.get_errors()), 0)

if __name__ == '__main__':
    unittest.main()
