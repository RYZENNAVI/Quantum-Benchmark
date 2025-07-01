"""
Quantum Circuit Validator Demo Script

This script automatically reads all JSON files from the example folder and validates them.
It displays the content of each file and detailed validation results.
"""

import json
import os
from quantum_validator import validate_quantum_circuit
# Usage: python demo.py

def print_separator(title):
    """Print separator line and title"""
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)


def print_json(data):
    """Format and print JSON data"""
    print(json.dumps(data, indent=2, ensure_ascii=False))


def validate_and_print_result(file_path):
    """Validate file and print results"""
    print(f"\nValidating file: {file_path}")
    print("-" * 60)
    
    # Read and display file content
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        print("File content:")
        print_json(data)
        print("-" * 60)
    except Exception as e:
        print(f"Failed to read file: {str(e)}")
        return
    
    # Validate data
    result = validate_quantum_circuit(file_path=file_path)
    
    # Print validation results
    if result['valid']:
        print("✅ Validation passed! The data format is correct.")
    else:
        print("❌ Validation failed! Found the following errors:")
        for i, error in enumerate(result['errors'], 1):
            print(f"  {i}. {error}")


def main():
    """Main function"""
    print_separator("Quantum Circuit Validator Demo")
    
    # Get all JSON files from example folder
    example_dir = "example"
    if not os.path.exists(example_dir):
        print(f"Error: {example_dir} folder does not exist")
        return
    
    json_files = [f for f in os.listdir(example_dir) if f.endswith('.json')]
    
    if not json_files:
        print(f"Error: No JSON files found in {example_dir} folder")
        return
    
    # Validate each JSON file
    for i, json_file in enumerate(sorted(json_files), 1):
        file_path = os.path.join(example_dir, json_file)
        print_separator(f"Validating file {i}/{len(json_files)}: {json_file}")
        validate_and_print_result(file_path)
    
    print_separator("Validation Complete")


if __name__ == "__main__":
    main()