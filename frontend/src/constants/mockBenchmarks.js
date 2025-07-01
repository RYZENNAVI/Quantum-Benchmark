// src/constants/benchmarks.js

/**
 * Sample constants file. The frontend can obtain the list of datasets, ansatz, and baselines
 * by calling the `/api/benchmarks` endpoint or directly reading these constants.
 * Adjust according to the structure returned by the backend.
 */

export const SAMPLE_DATASETS = [

  {
    id: 'bars-and-stripes',
    name: 'Bars and Stripes',
    description: 'Synthetic Bars-and-Stripes toy dataset, 4×4 binary images.',
    samples: 16,
    features: 16,
    classes: 2,
    visualizationText: [
      'Original image: 4×4 binary',
      'After downsampling: 3×3 grayscale',
      'Can be used to demonstrate dimensionality reduction'
    ]
  },
  {
    id: 'digits-0-1',
    name: 'Digits 0 vs 1',
    description: 'MNIST-like dataset containing only digits 0 and 1.',
    samples: 360,
    features: 9, // Downsampled to 3×3
    classes: 2,
    visualizationText: [
      'Original image: 8×8 grayscale',
      'After downsampling: 3×3 grayscale',
      'Only classes 0 and 1 are kept'
    ]
  },
  {
    id: 'binary-blobs',
    name: 'Binary Blobs',
    description: 'Synthetic Binary Blobs dataset containing only labels 0 and 1.',
    samples: 32,
    features: 9, // Downsampled to 3×3
    classes: 2,
    visualizationText: [
      'Original image: 4×4 binary',
      'After downsampling: 3×3 grayscale',
      'Labels 0 vs 1 only'
    ]
  }
];

export const SAMPLE_ANSATZ = [
  {
    id: 'ans1',
    name: 'Hardware-Efficient Ansatz',
    description: 'Composed of alternating RX/RZ layers, suitable for NISQ hardware.',
    "circuit": [
      {
        "id": "Bo4s6B",
        "type": "H",
        "target": [
          0
        ],
        "params": [],
        "timeStep": 0
      }
    ],
    "parameters": [],
    "inputs": []
  },
  {
    id: 'ans2',
    name: 'QAOA Ansatz',
    description: 'Typical circuit structure used in the Quantum Approximate Optimization Algorithm (QAOA).',
    "circuit": [
      {
        "id": "pjZXwH",
        "type": "Y",
        "target": [
          1
        ],
        "params": [],
        "timeStep": 1
      },
      {
        "id": "MryzcW",
        "type": "RX",
        "target": [
          0
        ],
        "params": [
          0
        ],
        "timeStep": 3
      },
      {
        "id": "u9Ph5m",
        "type": "RY",
        "target": [
          0
        ],
        "params": [
          0
        ],
        "timeStep": 1
      },
      {
        "id": "Ej-4BH",
        "type": "H",
        "target": [
          1
        ],
        "params": [],
        "timeStep": 5
      },
      {
        "id": "n5b43l",
        "type": "Y",
        "target": [
          2
        ],
        "params": [],
        "timeStep": 4
      }
    ],
    "parameters": [],
    "inputs": []
  }
];

export const SAMPLE_BASELINES = [
  {
    id: 'bl1',
    name: 'Identity Baseline',
    description: 'Identity operation, no quantum gates applied.',
    circuit: {
      qubits: 4,
      gates: []
    }
  },
  {
    id: 'bl2',
    name: 'Single-H Baseline',
    description: 'Apply a Hadamard gate only on qubit 0.',
    circuit: {
      qubits: 4,
      gates: [
        { id: 'h0', type: 'H', target: [0], timeStep: 0 }
      ]
    }
  },
  {
    id: 'bl3',
    name: 'Amplitude Embedding',
    description: 'Use AmplitudeEmbedding to load feature vectors into quantum amplitudes.',
    circuit: {
      qubits: 4,
      gates: [
        { name: 'AmplitudeEmbedding', targets: [0, 1, 2, 3], params: ['f[0..15]'], timeStep: 0 }
      ]
    }
  }
];

