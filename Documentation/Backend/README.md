# Frontend Documentation

## Overview
To do:  Komponentenbeschreibung

## Installation guide
### Start backend services
The project provides a Docker setup for running the FastAPI server,
MongoDB and RabbitMQ. From the repository root simply execute:

```bash
docker-compose up
```

If you need to rebuild the Docker images, use:

```bash
docker-compose up --build
```

This will start all three services and expose the FastAPI application on
`http://localhost:8000`.

### Using the Swagger UI
FastAPI provides interactive API documentation via Swagger UI. Once the services
are running, open your browser and navigate to `http://localhost:8000/docs` to
view and test the available endpoints. An alternative ReDoc interface is
available at `http://localhost:8000/redoc`.


## API Definitions

### **Encoding Upload API**
- **Direction:** FE → BE  
- **Endpoint:** `/api/encoding`  
- **Description:** Transfers uploaded or editor-created quantum encodings in JSON format.

**Example Request:**

```json
[
  {"gate": "RY", "wires": [0], "params": ["theta_1"]},
  {"gate": "CNOT", "wires": [0, 1]},
  {"gate": "RZ", "wires": [1], "params": ["x_1"]},
  {"gate": "RZ", "wires": [1], "params": [0.33]}
]
```
**Example response :**
```json
{"id": 123}
```
### **Run Benchmark Request API**
- **Direction:** FE → BE  
- **Endpoint:** `/api/run`  
- **Description:** Starts the evaluation for a given encoding combined with a selected dataset and ansatz.

**Example response :**
```json
{"id": 123}
```

### **Benchmark Result API**
- **Direction:** BE → FE  
- **Endpoint:** `/api/result`  
- **Description:** Returns result data such as accuracy, loss, and circuit depth in JSON format. These results are visualized in the dashboard.

**Example Request:**

```json
{
  "results": [
    {
      "encoding_id": 2,
      "ansatz_id": 1,
      "data_id": 1,
      "loss": 123,
      "accuracy": 123
    }
  ],
  "encodings": {
    "2": {"depth": 5, "name": "Basis encoding", "description": "Lorem ipsum"}
  },
  "ansaetze": {
    "2": {"depth": 5, "name": "Basis encoding", "description": "Lorem ipsum"}
  }
}
```
### **Reference Data API**
- **Direction:** BE → FE  
- **Endpoint:** `/api/dataset`  
- **Description:** Provides information about available datasets, ansätze, and baseline encodings.

**Example Request:**

```json
{
  "encodings": {
    "2": {"depth": 5, "name": "Basis encoding", "description": "Lorem ipsum", "circuit": {...}}
  },
  "ansaetze": {
    "2": {"depth": 5, "name": "Random Layer", "description": "Lorem ipsum", "circuit": {...}}
  },
  "data": {
    "2": {"depth": 5, "name": "Digits", "description": "Lorem ipsum"}
  }
}
```


## Customisation
To do: Ansätze, Beispiel Encoding, data  wie und wo


## Issues and solutions
To do: Falls benötigt