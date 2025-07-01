# Input data for machine learning
## Bars and Stribes
The dataset “Stripes and Bars” (https://pennylane.ai/datasets/bars-and-stripes) from the Python package Pennylane is a collection of images containing patterns of stripes and bars. The dataset contains 1000 datasets consisting of an image and a label. The labels correspond to

```
-1  =  horizontal/stripes
 1  =  vertical/bars
```

![BarsAndStripes](/material/Images/BarsAndStripes.png)

## Digits
The dataset "Digits 0 and 1 (Downscaled)" (https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html#sklearn.datasets.load_digits) is a filtered and processed subset of the “Digits” dataset from the sklearn.datasets module. The original dataset consists of 8×8 grayscale images of handwritten digits (0–9), with approximately 180 samples per class and a total of 1797 images.
In this subset, only the digits 0 and 1 are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels using reflective interpolation and then flattened to a 9-dimensional vector with normalized pixel values.
```
0  =  Label 0
1  =  Label 1
```

![Digits](/material/Images/load_digits.png)

## Binary Blobs
The dataset “Binary Blobs 0 and 1 (Downscaled)” (https://pennylane.ai/datasets/binary-blobs) is a filtered and processed subset of the “Binary Blobs” dataset from the Python package Pennylane.
The original dataset consists of 4×4 grayscale images, each assigned to one of 8 patterns. The original dataset consists of 5000 training data and 10000 test data. 
In this subset, only the first two patterns are selected, resulting in a smaller binary classification dataset. Each selected image is resized to 3×3 pixels by reflective interpolation and then smoothed into a 9-dimensional vector with normalized pixel values.

```
0  =  pale square in the top left-hand corner
1  =  pale square in the top right-hand corner
```

![Binary Blobs](/material/Images/BinaryBlobs.png)

# Ansätze
In quantum computing Ansätze are the various concepts and methods that are being developed to harness the potential of quantum mechanics for practical calculations.

## CVNeuralNetLayers
https://docs.pennylane.ai/en/stable/code/api/pennylane.CVNeuralNetLayers.html

The CVNeuralNetLayers Ansatz is used for continuous-variable (CV) quantum systems. It is made up of layers that include local operations like displacement, squeezing, and rotation, as well as interferometers that create entanglement between modes. The BS (beamsplitter) blocks in the circuit perform this entanglement by mixing adjacent quantum modes. Each layer works like a classical neural network and allows complex transformations of quantum states on photonic hardware. This Ansatz is especially useful for tasks that need flexible, nonlinear transformations of continuous-variable data, such as in quantum machine learning.

![CVNeuralNetLayers](/material/Images/CVNeuralNetLayers.png)

## StronglyEntangling
https://docs.pennylane.ai/en/stable/code/api/pennylane.StronglyEntanglingLayers.html

The StronglyEntanglingLayers Ansatz creates alternating layers of single-qubit rotations and two-qubit entangling gates. Each layer includes parameterized rotations (typically RX, RY, RZ) applied to every qubit, followed by controlled-Z or CNOT entangling gates arranged in a fixed pattern.
This Ansatz is widely used in variational quantum algorithms because it introduces a strong level of entanglement and expressivity, which makes it suitable for learning complex functions. The layer structure is regular and scalable, making it practical for circuits of various sizes.

![StronglyEntangling](/material/Images/StronglyEntanglingLayers.png)

## Fix Version of RandomLayers
https://docs.pennylane.ai/en/stable/code/api/pennylane.RandomLayers.html  
RandomLayers contains layers of randomly selected single-bit rotations and 2-qubit entanglement gates acting on randomly selected qubits.
In this case, a fixed version is used to allow comparison.

![RandomLayers](/material/Images/RandomLayers.png)

# Encodings
Encodings are methods for transferring classical information into qubits. This means that a certain amount of data is translated into the state of a quantum computer in such a way that it can work with it.

## Amplitude Embedding
https://docs.pennylane.ai/en/stable/code/api/pennylane.AmplitudeEmbedding.html  
Amplitude embedding encodes 2^n features into the amplitude vector of n qubits. It encodes a vector x with a length of N into amplitudes of an n-qubit state.
With amplitude embedding, we can map complex or high dimensional features to fewer qubits.

![Amplitude Embedding](/material/Images/AmplitudeEmbedding.png)

## Angle Embedding
https://docs.pennylane.ai/en/stable/code/api/pennylane.AngleEmbedding.html  
Angle embedding encodes N features into the rotation of n qubits, where N ≤ n.
Angle embedding allows us to convert classical data into a form that can be used in quantum computing.

![Angle Embedding](/material/Images/AngleEmbedding.png)

## Basis Embedding
https://docs.pennylane.ai/en/stable/code/api/pennylane.BasisEmbedding.html  
Basis embedding associates each input with a computational basis state of a qubit system. Therefore, classical data has to be in the form of binary strings. 
The embedded quantum state is the bit-wise translation of a binary string to the corresponding states of the quantum subsystems. For example, x=1001 is represented by the 4-qubit quantum state |1001⟩. Hence, one bit of classical information is represented by one quantum subsystem.

![Basis Embedding](/material/Images/BasisEmbedding.png)