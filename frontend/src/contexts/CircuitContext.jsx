import React, {
    createContext,
    useContext,
    useState,
    useCallback,
} from 'react';
import { nanoid } from 'nanoid';
import { GATE_DEFS } from '@/constants/gates';

/**
 * CircuitContext 负责管理电路全局状态（qubits 数、变量数量与 gate 列表）
 */
const CircuitContext = createContext(null);

export const CircuitProvider = ({ children }) => {
    /** Number of qubit rows (default 5 rows) */
    const [qubits, setQubits] = useState(5);
    
    /** Number of variables (default 4 variables) */
    const [variables, setVariables] = useState(4);

    /**
     * gates 数组，每个 gate 至少包含:
     * { id, type, target:[row], control?, params?, timeStep }
     */
    const [gates, setGates] = useState([]);

    /** Add new Gate (called after successful external drag) */
    // If id is already generated during drag, use it directly; otherwise, add an id
    const addGate = useCallback((gate) => {
        // Wenn bereits eine ID beim Drag generiert wurde, verwende diese; sonst erstelle eine neue
        setGates((prev) => [...prev, { id: gate.id ?? nanoid(6), ...gate }]);
    }, []);

    /** Update gate properties */
    // Ensure params is an array
    // Debug log
    const updateGate = useCallback((gateId, updates) => {
        setGates(prevGates => {
            const gateIndex = prevGates.findIndex(g => g.id === gateId);
            if (gateIndex === -1) return prevGates;

            const updatedGates = [...prevGates];
            updatedGates[gateIndex] = {
                ...updatedGates[gateIndex],
                ...updates,
                // Sicherstellen, dass params ein Array ist
                params: Array.isArray(updates.params) ? updates.params : updatedGates[gateIndex].params
            };

            // Debug-Log
            console.log('Updating gate in circuit:', {
                gateId,
                updates,
                updatedGate: updatedGates[gateIndex]
            });

            return updatedGates;
        });
    }, []);

    /** Delete Gate (called when pressing Delete or right-click menu) */
    const removeGate = useCallback((id) => {
        setGates((prev) => prev.filter((g) => g.id !== id));
    }, []);

    /**
     * 用于 "Import JSON"：
     * 详细验证每个门的属性，确保符合定义
     */
    const replaceCircuit = useCallback((payload) => {
        // Basic schema validation
        if (typeof payload?.qubits !== 'number' || !Array.isArray(payload?.gates)) {
            throw new Error('Invalid circuit JSON: require { qubits:number, gates:[] }');
        }

        // Calculate the actual number of qubits needed
        let maxQubit = 0;
        payload.gates.forEach(gate => {
            // Check the maximum index in target
            if (Array.isArray(gate.target)) {
                const maxTarget = Math.max(...gate.target);
                if (maxTarget > maxQubit) maxQubit = maxTarget;
            }
            // Check the maximum index in control
            if (Array.isArray(gate.control)) {
                const maxControl = Math.max(...gate.control);
                if (maxControl > maxQubit) maxQubit = maxControl;
            }
        });

        // The number of qubits should be the maximum index + 1, and at least the number specified by payload.qubits
        const requiredQubits = Math.max(maxQubit + 1, payload.qubits);

        // Validate each gate's properties
        const validatedGates = payload.gates.map(gate => {
            // Check if gate type exists
            if (!GATE_DEFS[gate.type]) {
                throw new Error(`Invalid gate type: ${gate.type}`);
            }

            const gateDef = GATE_DEFS[gate.type];
            const validatedGate = { ...gate };

            // Ensure id exists
            if (!validatedGate.id) {
                validatedGate.id = nanoid(6);
            }

            // Validate target qubits
            if (!Array.isArray(gate.target) || gate.target.length === 0) {
                throw new Error(`Gate ${gate.id}: target must be a non-empty array`);
            }

            // Validate control points
            if (gateDef.requiresControl) {
                if (!gate.control || !Array.isArray(gate.control)) {
                    validatedGate.control = [gate.target[0] > 0 ? gate.target[0] - 1 : gate.target[0] + 1];
                }
            }

            // Validate parameters
            if (gateDef.params && gateDef.params.length > 0) {
                if (!Array.isArray(gate.params)) {
                    validatedGate.params = gateDef.params.map(p => p.default ?? 0);
                } else {
                    // Ensure all parameters are present
                    const validatedParams = [...gate.params];
                    while (validatedParams.length < gateDef.params.length) {
                        validatedParams.push(gateDef.params[validatedParams.length].default ?? 0);
                    }
                    validatedGate.params = validatedParams;
                }
            }

            // Validate time steps
            if (typeof gate.timeStep !== 'number' || gate.timeStep < 0) {
                throw new Error(`Gate ${gate.id}: invalid timeStep`);
            }

            return validatedGate;
        });

        // Set the calculated number of qubits and variables
        setQubits(requiredQubits);
        if (payload.variables && typeof payload.variables === 'number') {
            setVariables(payload.variables);
        }
        setGates(validatedGates);
    }, []);

    /** Export JSON structure to backend or download */
    const exportCircuit = useCallback((format = 'backend') => {
        // Sort by time step
        const sortedGates = [...gates].sort((a, b) => a.timeStep - b.timeStep);

        // Calculate the actual number of qubits needed based on gate wires
        let maxQubit = 0;
        sortedGates.forEach(gate => {
            if (Array.isArray(gate.target)) {
                const maxTarget = Math.max(...gate.target);
                if (maxTarget > maxQubit) maxQubit = maxTarget;
            }
            if (Array.isArray(gate.control)) {
                const maxControl = Math.max(...gate.control);
                if (maxControl > maxQubit) maxQubit = maxControl;
            }
        });

        // The actual number of qubits is maxQubit + 1
        const actualQubits = maxQubit + 1;

        if (format === 'backend') {
            // Backend format: keep the original format
            return {
                qubits: actualQubits,
                variables: variables,
                gates: sortedGates
            };
        } else {
            // Export format: convert to the required format and handle rotation gate counts
            const circuitData = [];
            
            sortedGates.forEach(gate => {
                const gateDef = GATE_DEFS[gate.type];
                const isRotationGate = ['RX', 'RY', 'RZ'].includes(gate.type);
                
                if (isRotationGate && gate.params && gate.params.length >= 2) {
                    // For rotation gates, expand based on count parameter
                    const count = Math.round(gate.params[0] || 1);
                    const angle = gate.params[1] || 0;
                    
                    // Create multiple gates based on count
                    for (let i = 0; i < count; i++) {
                        const gateObj = {
                            gate: gate.type,
                            wires: gate.control ? [...gate.control, ...gate.target] : gate.target,
                            params: [angle] // Only export the angle parameter
                        };
                        circuitData.push(gateObj);
                    }
                } else {
                    // For non-rotation gates or rotation gates without count
                    const gateObj = {
                        gate: gate.type,
                        wires: gate.control ? [...gate.control, ...gate.target] : gate.target,
                        params: Array.isArray(gate.params) ? gate.params : []
                    };
                    circuitData.push(gateObj);
                }
            });
            
            return circuitData;
        }
    }, [gates, qubits, variables]);

    const value = {
        circuit: { qubits, variables, gates },
        /* state setters */
        setQubits,
        setVariables,
        addGate,
        updateGate,
        removeGate,
        replaceCircuit,
        exportCircuit,
    };

    return (
        <CircuitContext.Provider value={value}>
            {children}
        </CircuitContext.Provider>
    );
};

/** Any component inside <CircuitProvider> can use useCircuit() to get the state */
export const useCircuit = () => {
    const ctx = useContext(CircuitContext);
    if (!ctx) throw new Error('useCircuit must be used within CircuitProvider');
    return ctx;
};
