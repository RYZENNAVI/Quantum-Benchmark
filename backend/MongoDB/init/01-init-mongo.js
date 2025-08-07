// Switch to the Quantum-Encoding-DB database (creates it if it doesn't exist)
db = db.getSiblingDB('Quantum-Encoding-DB');

//Validators
ansaetze_validator = {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["id", "name"],
            properties: {
                id: {
                    bsonType: "int",
                    description: "Id of the ansatz"
                },
                name: {
                    bsonType: "string",
                    description: "Name of the ansatz"
                },
                url: {
                    bsonType: "string",
                    description: "Url of the ansatz infos"
                },
                description: {
                    bsonType: "string",
                    description: "Description of the ansatz"
                }
            }
        }
    }
}

datasets_validator = {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["id", "name"],
            properties: {
                id: {
                    bsonType: "int",
                    description: "Id of the dataset"
                },
                name: {
                    bsonType: "string",
                    description: "Name of the dataset"
                },
                url: {
                    bsonType: "string",
                    description: "Url of the dataset infos"
                },
                description: {
                    bsonType: "string",
                    description: "Description of the dataset"
                }
            }
        }
    }
}

encodings_validator = {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["id"],
            properties: {
                id: {
                    bsonType: "int",
                    description: "Id of the encoding"
                },
                name: {
                    bsonType: "string",
                    description: "Name of the encoding"
                },
                url: {
                    bsonType: "string",
                    description: "Url of the encoding infos"
                },
                description: {
                    bsonType: "string",
                    description: "Description of the encoding"
                }
            }
        }
    }
}

//Table Creation
db.createCollection('ansaetze', ansaetze_validator);
db.ansaetze.insert([
    {
        "id":1,
        "name":"CVNeuralNetLayers",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.CVNeuralNetLayers.html",
        "description":"The CVNeuralNetLayers Ansatz is used for continuous-variable (CV) quantum systems. It is made up of layers that include local operations like displacement, squeezing, and rotation, as well as interferometers that create entanglement between modes. The BS (beamsplitter) blocks in the circuit perform this entanglement by mixing adjacent quantum modes. Each layer works like a classical neural network and allows complex transformations of quantum states on photonic hardware. This Ansatz is especially useful for tasks that need flexible, nonlinear transformations of continuous-variable data, such as in quantum machine learning."
    },
    {
        "id":2,
        "name":"RandomLayers",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.StronglyEntanglingLayers.html",
        "description":"RandomLayers contains layers of randomly selected single-bit rotations and 2-qubit entanglement gates acting on randomly selected qubits.\nIn this case, a fixed version is used to allow comparison."
    },
    {
        "id":3,
        "name":"StronglyEntanglingLayers",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.RandomLayers.html",
        "description":"The StronglyEntanglingLayers Ansatz creates alternating layers of single-qubit rotations and two-qubit entangling gates. Each layer includes parameterized rotations (typically RX, RY, RZ) applied to every qubit, followed by controlled-Z or CNOT entangling gates arranged in a fixed pattern.\nThis Ansatz is widely used in variational quantum algorithms because it introduces a strong level of entanglement and expressivity, which makes it suitable for learning complex functions. The layer structure is regular and scalable, making it practical for circuits of various sizes."
    }
])

db.createCollection('datasets', datasets_validator);
db.datasets.insert([
    {
        "id":1,
        "name":"Bars and Stribes",
        "url":"https://pennylane.ai/datasets/bars-and-stripes",
        "description":"The dataset “Stripes and Bars” (https://pennylane.ai/datasets/bars-and-stripes) from the Python package Pennylane is a collection of images containing patterns of stripes and bars. The dataset contains 1000 datasets consisting of an image and a label. The labels correspond to\n\n```\n-1  =  horizontal/stripes\n 1  =  vertical/bars\n```"
    },
    {
        "id":2,
        "name":"Digits",
        "url":"https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html#sklearn.datasets.load_digits",
        "description":"The dataset \"Digits 0 and 1 (Downscaled)\" (https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html#sklearn.datasets.load_digits) is a filtered and processed subset of the “Digits” dataset from the sklearn.datasets module. The original dataset consists of 8×8 grayscale images of handwritten digits (0–9), with approximately 180 samples per class and a total of 1797 images.\nIn this subset, only the digits 0 and 1 are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels using reflective interpolation and then flattened to a 9-dimensional vector with normalized pixel values.\n```\n0  =  Label 0\n1  =  Label 1\n```"
    },
    {
        "id":3,
        "name":"Binary Blobs",
        "url":"https://pennylane.ai/datasets/binary-blobs",
        "description":"The dataset “Binary Blobs 0 and 1 (Downscaled)” (https://pennylane.ai/datasets/binary-blobs) is a filtered and processed subset of the “Binary Blobs” dataset from the Python package Pennylane.\nThe original dataset consists of 4×4 grayscale images, each assigned to one of 8 patterns. The original dataset consists of 5000 training data and 10000 test data. \nIn this subset, only the first two patterns are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels by reflective interpolation and then smoothed into a 9-dimensional vector with normalized pixel values.\n\n```\n0  =  pale square in the top left-hand corner\n1  =  pale square in the top right-hand corner\n```"
    },
    {
        "id":4,
        "name":"Wine",
        "url":"https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_wine.html#sklearn.datasets.load_wine",
        "description":"The data is the results of a chemical analysis of wines grown in the same region in Italy by three different cultivators. There are thirteen different measurements taken for different constituents found in the three types of wine."
    }
])

db.createCollection('encodings', encodings_validator);
db.encodings.insert([
    {
        "id":1,
        "name":"Amplitude Embedding",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.AmplitudeEmbedding.html",
        "description":"Amplitude embedding encodes 2^n features into the amplitude vector of n qubits. It encodes a vector x with a length of N into amplitudes of an n-qubit state.\nWith amplitude embedding, we can map complex or high dimensional features to fewer qubits."
    },
    {
        "id":2,
        "name":"Angle Embedding",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.AngleEmbedding.html",
        "description":"Angle embedding encodes N features into the rotation of n qubits, where N ≤ n.\nAngle embedding allows us to convert classical data into a form that can be used in quantum computing."
    },
    {
        "id":3,
        "name":"Basis Embedding",
        "url":"https://docs.pennylane.ai/en/stable/code/api/pennylane.BasisEmbedding.html",
        "description":"Basis embedding associates each input with a computational basis state of a qubit system. Therefore, classical data has to be in the form of binary strings. \nThe embedded quantum state is the bit-wise translation of a binary string to the corresponding states of the quantum subsystems. For example, x=1001 is represented by the 4-qubit quantum state |1001⟩. Hence, one bit of classical information is represented by one quantum subsystem."
    }
])

db.createCollection('benchmarkResults');

db.createCollection('benchmarkRuns');
