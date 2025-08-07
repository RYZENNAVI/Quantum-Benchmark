// src/constants/benchmarks.js

/**
 * Example constant file, frontend obtains datasets, ansatz, and baselines lists
 * through the `/api/benchmarks` interface or directly reads these constants.
 * You can adjust according to the structure returned by the backend.
 */

export const SAMPLE_DATASETS = [
  {
    id: 1,
    name: 'Bars and Stripes',
    description: 'Synthetic Bars-and-Stripes toy dataset, 4×4 binary images.',
    samples: 16,
    features: 16,
    classes: 2,
    visualizationText: [
      'Original image: 4×4 binary',
      'Downsampled: 3×3 grayscale',
      'Can be used to demonstrate dimensionality reduction'
    ]
  },
  {
    id: 2,
    name: 'Digits 0 vs 1',
    description: 'MNIST-like dataset, containing only 0 and 1 image samples.',
    samples: 360,
    features: 9, // Downsampled to 3×3
    classes: 2,
    visualizationText: [
      'Original image: 8×8 grayscale',
      'Downsampled: 3×3 grayscale',
      'Only 0 and 1 classes'
    ]
  },
  {
    id: 3,
    name: 'Binary Blobs',
    description: 'Synthetic Binary Blobs dataset, containing only labels 0 and 1.',
    samples: 32,
    features: 9, // Downsampled to 3×3
    classes: 2,
    visualizationText: [
      'Original image: 4×4 binary',
      'Downsampled: 3×3 grayscale',
      'Only label 0 vs 1'
    ]
  }
];

export const SAMPLE_ANSATZ = [
  {
    id: 2,
    name: 'Random Layers',
    description: 'A flexible ansatz that uses random quantum gates to create complex quantum circuits.',
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
    id: 1,
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
  }
];

export const SAMPLE_BASELINES = [
  {
    id: 1,
    name: 'Identity Baseline',
    description: 'No quantum gates applied.',
    circuit: {
      qubits: 4,
      gates: []
    }
  },
  {
    id: 2,
    name: 'Single-H Baseline',
    description: 'Only Hadamard gate applied on qubit 0.',
    circuit: {
      qubits: 4,
      gates: [
        { id: 'h0', type: 'H', target: [0], timeStep: 0 }
      ]
    }
  },
  {
    id: 3,
    name: 'Amplitude Embedding',
    description: 'Loads feature vector into quantum amplitude using AmplitudeEmbedding.',
    circuit: {
      qubits: 4,
      gates: [
        { name: 'AmplitudeEmbedding', targets: [0, 1, 2, 3], params: ['f[0..15]'], timeStep: 0 }
      ]
    }
  }
];

