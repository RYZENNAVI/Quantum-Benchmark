#!/bin/bash

echo "Start data import..."

# IMPORTANT: wait for mongodb
sleep 5

DB="Quantum-Encoding-DB"
JSON_DIR="/docker-entrypoint-initdb.d/json"

for file in "$JSON_DIR"/*.json; do
  filename=$(basename "$file" .json)
  echo "Importing $filename.json into collection '$filename'..."
  mongoimport --host localhost --db "$DB" --collection "$filename" --file "$file" --jsonArray
done

echo "Finished data import."