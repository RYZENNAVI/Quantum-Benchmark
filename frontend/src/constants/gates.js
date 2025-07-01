/* Unified gate definitions — shared by Palette / Canvas / Drawer */
export const GATE_DEFS = {
    /* ───── Basic ───── */
    H: { label: 'H', category: 'foundation', params: [] },
    X: { label: 'X', category: 'foundation', params: [] },
    Y: { label: 'Y', category: 'foundation', params: [] },
    Z: { label: 'Z', category: 'foundation', params: [] },

    /* ───── Rotation Gates ───── */
    RX: {
        label: 'RX', category: 'rotation',
        params: [{ key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }]
    },
    RY: {
        label: 'RY', category: 'rotation',
        params: [{ key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }]
    },
    RZ: {
        label: 'RZ', category: 'rotation',
        params: [{ key: 'theta', label: 'θ (rad)', min: 0, max: Math.PI * 2, step: 0.01, default: 0 }]
    },

    /* ───── Entanglement / Controlled ───── */
    CNOT: { label: 'CNOT', category: 'entangle', params: [], requiresControl: true },
    CZ: { label: 'CZ', category: 'entangle', params: [], requiresControl: true },
    SWAP: { label: 'SWAP', category: 'entangle', params: [], requiresControl: true, multiTarget: true }
};

/** List of gates with parameters (used by Drawer/Palette for detection) */
export const PARAM_GATES = Object.entries(GATE_DEFS)
    .filter(([, def]) => def.params.length > 0)
    .map(([k]) => k);
