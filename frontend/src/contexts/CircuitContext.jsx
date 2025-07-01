import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { nanoid } from 'nanoid';

/**
 * CircuitContext manages the global circuit state (number of qubits and list of gates)
 */
const CircuitContext = createContext(null);

export const CircuitProvider = ({ children }) => {
    /** Number of qubit lines (default 5) */
    const [qubits, setQubits] = useState(5);

    /**
     * The gates array, each gate contains at minimum:
     * { id, type, target:[row], control?, params?, timeStep }
     */
    const [gates, setGates] = useState([]);

    /* New: store variable parameters and input list */
    const [parameters, setParameters] = useState([]);
    const [inputs, setInputs] = useState([]);

    /* ---------------------------------------------------------
       Sync `inputs` length with `qubits`
       Whenever the qubit count changes (either via visual editor or
       JSON import), automatically resize the `inputs` array so that
       its length equals the qubit number expected by the backend
       validator.

       New items are filled with placeholder names ``x_i``.
    --------------------------------------------------------- */
    useEffect(() => {
        setInputs(prev => {
            const q = qubits;
            if (q === prev.length) return prev;
            const arr = [...prev];
            if (q > arr.length) {
                for (let i = arr.length; i < q; i++) arr.push(`x_${i}`);
            } else {
                arr.length = q; // truncate when qubits decreased
            }
            return arr;
        });
    }, [qubits]);

    /** Add a new Gate (called after external drag succeeds) */
    const addGate = useCallback((gate) => {
        // If an id has already been generated during dragging, reuse it; otherwise create one
        setGates((prev) => [...prev, { id: gate.id ?? nanoid(6), ...gate }]);
    }, []);

    /** Update Gate (called when the parameter editor drawer is saved) */
    const updateGate = useCallback((id, updates) => {
        setGates((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    }, []);

    /** Delete Gate (called when Delete key is pressed or via context menu) */
    const removeGate = useCallback((id) => {
        setGates((prev) => prev.filter((g) => g.id !== id));
    }, []);

    /**
     * For "Import JSON":
     * After basic schema validation, replace qubits & gates in one shot
     */
    const replaceCircuit = useCallback((payload) => {
        const gatesArray = Array.isArray(payload.gates) ? payload.gates : payload.circuit;
        if (
            typeof payload?.qubits !== 'number' ||
            !Array.isArray(gatesArray)
        ) {
            throw new Error('Invalid circuit JSON: require { qubits:number, circuit:[] }');
        }
        setQubits(payload.qubits);
        setGates(gatesArray);
        /* If the uploaded JSON contains parameters / inputs fields, persist them as well */
        setParameters(Array.isArray(payload.parameters) ? payload.parameters : []);
        setInputs(Array.isArray(payload.inputs) ? payload.inputs : []);
    }, []);

    /** Export JSON structure to the backend or for download */
    const exportCircuit = useCallback(() => ({
        qubits,
        circuit: gates,
        parameters,
        inputs,
    }), [qubits, gates, parameters, inputs]);

    const value = {
        circuit: { qubits, gates, parameters, inputs },
        /* state setters */
        setQubits,
        addGate,
        updateGate,
        removeGate,
        replaceCircuit,
        exportCircuit,
        /* Expose parameters / inputs state in case they need to be edited later */
        parameters,
        inputs,
        setParameters,
        setInputs,
    };

    return (
        <CircuitContext.Provider value={value}>
            {children}
        </CircuitContext.Provider>
    );
};

/** Any component within <CircuitProvider> can call useCircuit() to access the state */
export const useCircuit = () => {
    const ctx = useContext(CircuitContext);
    if (!ctx) throw new Error('useCircuit must be used within CircuitProvider');
    return ctx;
};
