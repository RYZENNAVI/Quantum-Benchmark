import pennylane as qml
import jax.numpy as jnp
import numpy as np
from sklearn.datasets import load_digits, load_wine
from sklearn.model_selection import train_test_split
from skimage.transform import resize

import ansaetze
import db


def load_dataset_by_id(dataset_id: int, n_qubits: int):
    key = str(n_qubits)
    if dataset_id == 1:
        # Reference: https://pennylane.ai/datasets/bars-and-stripes
        [ds] = qml.data.load("other", name="bars-and-stripes")
        if key not in ds.train:
            raise ValueError(f"Bars-and-Stripes nicht für {n_qubits} Qubits verfügbar! Verfügbare: {list(ds.train.keys())}")
        X = ds.train[key]['inputs']
        Y = ds.train[key]['labels']
        X_img = np.array([np.reshape(x, (n_qubits, n_qubits)) for x in X])
        X_flat = X_img.reshape((X_img.shape[0], -1)) / X_img.max()
        X_train, X_test, y_train, y_test = train_test_split(X_flat, Y, test_size=0.2, random_state=42)
        # Labels von -1/+1 auf 0/1 mappen
        y_train = np.array(y_train)
        y_test = np.array(y_test)
        y_train = ((y_train + 1) // 2).astype(int)
        y_test = ((y_test + 1) // 2).astype(int)
    elif dataset_id == 2:
        # Reference: https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html
        digits = load_digits()
        X_full = digits.images
        y_full = digits.target
        mask = (y_full == 0) | (y_full == 1)
        X_img = X_full[mask]
        y = y_full[mask]
        # Dynamische Zielgröße abhängig von n_qubits
        side = int(np.sqrt(2 ** n_qubits))
        X_small = np.array([resize(img, (side, side), mode='reflect') for img in X_img])
        X_flat = X_small.reshape((X_small.shape[0], -1)) / X_small.max()
        X_train, X_test, y_train, y_test = train_test_split(X_flat, y, test_size=0.2, random_state=42)
    elif dataset_id == 3:
        # Reference: https://pennylane.ai/datasets/binary-blobs
        [ds] = qml.data.load("other", name="binary-blobs")
        X = ds.train['inputs']
        y = ds.train['labels']
        # Filter only labels 0 and 1
        mask = (y == 0) | (y == 1)
        X_filtered = X[mask]
        y_filtered = y[mask]
        # Dynamisch die Seitenlänge bestimmen
        side = int(np.sqrt(len(X_filtered[0])))
        X_img = np.array([np.reshape(x, (side, side)) for x in X_filtered])
        X_flat = X_img.reshape((X_img.shape[0], -1)) / X_img.max()
        X_train, X_test, y_train, y_test = train_test_split(X_flat, y_filtered, test_size=0.2, random_state=42)
    elif dataset_id == 4:
        # Reference: https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_wine.html#sklearn.datasets.load_wine
        wine = load_wine()
        X_full = wine.data
        y_full = wine.target
        mask = (y_full == 0) | (y_full == 1)

        if len(X_full[0]) < n_qubits:
            raise ValueError(f'Wine dataset has a maximum of {len(X_full[0])} input parameters ({n_qubits = }).')

        X = np.array(X_full[mask])
        y = np.array(y_full[mask])
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        raise ValueError(f"Unbekannte dataset_id: {dataset_id}")
    return jnp.array(X_train), jnp.array(X_test), jnp.array(y_train), jnp.array(y_test)


def load_ansatz_by_id(ansatz_id: int):
    ansatz = ansaetze.ANSAETZE[ansatz_id]

    if not ansatz:
        raise ValueError(f"Unbekannte ansatz_id: {ansatz_id}")

    return ansatz


def load_encoding_from_db(encoding_id: int, n_qubits: int = 4) -> dict:

    if encoding_id == 0:
        # Test-Encoding: RY auf jedem Qubit, jedes Feature auf einen Qubit gemappt
        return {
            "gates": [
                {"gate": "RY", "wires": [i], "params": [f"input_{i}"]} for i in range(n_qubits)
            ]
        }

    database = db.get_db()
    collection = database["encodings"]
    encoding_doc = collection.find_one({"id": encoding_id})

    if not encoding_doc:
        raise ValueError(f"Encoding mit ID {encoding_id} nicht gefunden")

    gates = encoding_doc.get("circuit", {})

    return {"gates": gates}
