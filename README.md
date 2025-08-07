# Quantum Encoding Benchmarking Framework

## Project Description

Quantum computing has the potential to fundamentally transform machine learning, particularly through Quantum Machine Learning (QML)—an emerging field that integrates classical ML techniques with the computational advantages of quantum systems. A promising concept in QML is the use of Variational Quantum Algorithms (VQAs), which rely on a hybrid quantum-classical process where quantum circuits are optimized using classical algorithms. 

One of the most critical components in these algorithms is the quantum encoding—the method used to embed classical data into quantum states. These encodings define how information is represented and processed within quantum circuits, and they have a significant impact on the performance, expressiveness, and generalization capabilities of VQAs. 

Given their importance, systematically benchmarking quantum encodings is essential for understanding which encoding strategies are best suited for different types of data and tasks. However, this remains a challenging and largely open problem in the field. 

This software project focuses on addressing that challenge by developing a dedicated benchmarking application for quantum encodings in VQAs. The goal is to provide a web application, which allows users to upload, evaluate, and compare different encodings across a variety of datasets and algorithmic setups, laying the groundwork for more efficient and interpretable QML systems. 

## Installation
### Requirments
Docker required

### Start backend services
The project provides a Docker setup for running the FastAPI server,
MongoDB and RabbitMQ. Switch to folder /backend and simply execute:

```bash
docker-compose up
```

If you need to rebuild the Docker images, use:

```bash
docker-compose up --build
```

This will start all three services and expose the FastAPI application on
`http://localhost:8000`.

### Start backend worker
The worker requires a Docker setup, and all three backend services must be running (see above). <br>
Now you can run the worker container by starting the docker-compose file from the worker folder:

```bash
cd Worker
docker-compose up --build
```
The worker currently only connects if RabbitMQ is running on the same device in a different Docker network.

### Using the Swagger UI
FastAPI provides interactive API documentation via Swagger UI. Once the services
are running, open your browser and navigate to `http://localhost:8000/docs` to
view and test the available endpoints. An alternative ReDoc interface is
available at `http://localhost:8000/redoc`.

### Using the RabbitMQ Management
RabbitMQ provides a web-based management interface for monitoring and managing your message broker.  
Once the services are running, open your browser and navigate to `http://localhost:15672/` to access the interface.

Use the following credentials to log in:

- **Username:** `erik`  
- **Password:** `erik`

From the management dashboard, you can inspect queues, exchanges, connections, and message throughput in real time.


## Usage

Encodings can be entered as json files and a benchmark can be created for them. The json file must have the following structure:
```json
[
  {"gate": "RY", "wires":  [0], "params":  ["theta_1"]},
  {"gate": "CNOT", "wires":  [0, 1]},
  {"gate": "RZ", "wires":  [1], "params":  ["x_1"]},
  {"gate": "RZ", "wires":  [1], "params":  ["0.33"]}
]
```
To do: Alle Funktionen aus Nutzersicht beschreiben

## Documentation

Further documentation can be found [here](Documentation).

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
