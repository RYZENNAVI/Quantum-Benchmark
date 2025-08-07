/* Unified gate library definition —— shared by Palette / Canvas / Drawer */

// Unified gate color definitions
export const GATE_COLORS = {
    // Basic gates
    H: { bg: 'bg-blue-500', border: 'border-blue-600' },
    X: { bg: 'bg-red-500', border: 'border-red-600' },
    Y: { bg: 'bg-orange-500', border: 'border-orange-600' },
    Z: { bg: 'bg-purple-500', border: 'border-purple-600' },

    // Rotation gates
    RX: { bg: 'bg-green-500', border: 'border-green-600' },
    RY: { bg: 'bg-teal-500', border: 'border-teal-600' },
    RZ: { bg: 'bg-cyan-400', border: 'border-cyan-500' },

    // Controlled gates
    CNOT: { bg: 'bg-yellow-500', border: 'border-yellow-600' },
    CZ: { bg: 'bg-red-800', border: 'border-red-900' },
    SWAP: { bg: 'bg-violet-500', border: 'border-violet-600' },

    // Other common gates
    S: { bg: 'bg-indigo-500', border: 'border-indigo-600' },
    T: { bg: 'bg-pink-500', border: 'border-pink-600' },
    PHASE: { bg: 'bg-rose-500', border: 'border-rose-600' },
    U1: { bg: 'bg-amber-500', border: 'border-amber-600' },
    U2: { bg: 'bg-lime-500', border: 'border-lime-600' },
    U3: { bg: 'bg-emerald-500', border: 'border-emerald-600' },

    // Default color - for gates without defined colors
    default: { bg: 'bg-gray-500', border: 'border-gray-600' }
};

export const GATE_DEFS = {
    /* ───── Basic ───── */
    H: { label: 'H', category: 'foundation', params: [] },
    X: { label: 'X', category: 'foundation', params: [] },
    Y: { label: 'Y', category: 'foundation', params: [] },
    Z: { label: 'Z', category: 'foundation', params: [] },

    /* ───── Rotation gates ───── */
    RX: {
        label: 'RX', category: 'rotation',
        params: [
            { key: 'count', label: 'Anzahl', min: 1, max: 10, step: 1, default: 1, type: 'integer' },
            { key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }
        ]
    },
    RY: {
        label: 'RY', category: 'rotation',
        params: [
            { key: 'count', label: 'Anzahl', min: 1, max: 10, step: 1, default: 1, type: 'integer' },
            { key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }
        ]
    },
    RZ: {
        label: 'RZ', category: 'rotation',
        params: [
            { key: 'count', label: 'Anzahl', min: 1, max: 10, step: 1, default: 1, type: 'integer' },
            { key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }
        ]
    },

    /* ───── Entanglement / Controlled ───── */
    CNOT: { label: 'CNOT', category: 'entangle', params: [], requiresControl: true },
    CZ: { label: 'CZ', category: 'entangle', params: [], requiresControl: true },
    SWAP: { label: 'SWAP', category: 'entangle', params: [], requiresControl: true, multiTarget: true },

    /* ───── Other common gates ───── */
    S: { label: 'S', category: 'phase', params: [] },
    T: { label: 'T', category: 'phase', params: [] },
    PHASE: {
        label: 'PHASE',
        category: 'phase',
        params: [{ key: 'phi', label: 'φ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }]
    },
    U1: {
        label: 'U1',
        category: 'universal',
        params: [{ key: 'lambda', label: 'λ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }]
    },
    U2: {
        label: 'U2',
        category: 'universal',
        params: [
            { key: 'phi', label: 'φ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 },
            { key: 'lambda', label: 'λ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }
        ]
    },
    U3: {
        label: 'U3',
        category: 'universal',
        params: [
            { key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 },
            { key: 'phi', label: 'φ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 },
            { key: 'lambda', label: 'λ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }
        ]
    }
};

/** List of gates with parameters (for drawer/Palette determination) */
export const PARAM_GATES = Object.entries(GATE_DEFS)
    .filter(([, def]) => def.params.length > 0)
    .map(([k]) => k);
