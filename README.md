# Quantum Encoding Benchmarking Framework

## Project Description

Quantum computing has the potential to fundamentally transform machine learning, particularly through Quantum Machine Learning (QML)—an emerging field that integrates classical ML techniques with the computational advantages of quantum systems. A promising concept in QML is the use of Variational Quantum Algorithms (VQAs), which rely on a hybrid quantum-classical process where quantum circuits are optimized using classical algorithms. 

One of the most critical components in these algorithms is the quantum encoding—the method used to embed classical data into quantum states. These encodings define how information is represented and processed within quantum circuits, and they have a significant impact on the performance, expressiveness, and generalization capabilities of VQAs. 

Given their importance, systematically benchmarking quantum encodings is essential for understanding which encoding strategies are best suited for different types of data and tasks. However, this remains a challenging and largely open problem in the field. 

This software project focuses on addressing that challenge by developing a dedicated benchmarking application for quantum encodings in VQAs. The goal is to provide a web application, which allows users to upload, evaluate, and compare different encodings across a variety of datasets and algorithmic setups, laying the groundwork for more efficient and interpretable QML systems. 

## Installation

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

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

Encodings can be entered as json files and a benchmark can be created for them. The json file must have the following structure:
```json
[
  {"gate": "RY", "wires":  [0], "params":  ["theta_1"]},
  {"gate": "CNOT", "wires":  [0, 1]},
  {"gate": "RZ", "wires":  [1], "params":  ["x_1"]},
  {"gate": "RZ", "wires":  [1], "params":  ["0.33"]}
]
```

## Input data for machine learning
### Bars and Stribes
The dataset “Stripes and Bars” (https://pennylane.ai/datasets/bars-and-stripes) from the Python package Pennylane is a collection of images containing patterns of stripes and bars. The dataset contains 1000 datasets consisting of an image and a label. The labels correspond to

```
-1  =  horizontal/stripes
 1  =  vertical/bars
```

### Digits
The dataset "Digits 0 and 1 (Downscaled)" (https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html#sklearn.datasets.load_digits) is a filtered and processed subset of the “Digits” dataset from the sklearn.datasets module. The original dataset consists of 8×8 grayscale images of handwritten digits (0–9), with approximately 180 samples per class and a total of 1797 images.
In this subset, only the digits 0 and 1 are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels using reflective interpolation and then flattened to a 9-dimensional vector with normalized pixel values.
```
0  =  Label 0
1  =  Label 1
```

### Binary Blobs
The dataset “Binary Blobs 0 and 1 (Downscaled)” (https://pennylane.ai/datasets/binary-blobs) is a filtered and processed subset of the “Binary Blobs” dataset from the Python package Pennylane.
The original dataset consists of 4×4 grayscale images, each assigned to one of 8 patterns. The original dataset consists of 5000 training data and 10000 test data. 
In this subset, only the first two patterns are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels by reflective interpolation and then smoothed into a 9-dimensional vector with normalized pixel values.

```
0  =  pale square in the top left-hand corner
1  =  pale square in the top right-hand corner
```


## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
