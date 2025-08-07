// src/components/CircuitCanvas.jsx
import { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { nanoid } from 'nanoid';

import Gate from '@/components/Gate.jsx';
import GateActions from '@/components/GateActions.jsx';
import { ItemTypes } from '@/components/PaletteGate';
import { useCircuit } from '@/contexts/CircuitContext';
import { GATE_DEFS, PARAM_GATES } from '@/constants/gates';

export const GRID = 100; // Increase grid size to make the spacing between q0, q1, etc. larger
const MAX_COLS = 11; // t0~t8, total 9 columns

export default function CircuitCanvas({ onSelectGate, onOpenDrawer, initialCircuit, readOnly, hasUploadedFile, fileName }) {
    const cvsRef = useRef(null);
    const { circuit, addGate, updateGate, removeGate, replaceCircuit } = useCircuit();
    const [selectedGate, setSelectedGate] = useState(null);

    useEffect(() => {
        if (readOnly && initialCircuit) {
            console.log('Initial circuit data:', initialCircuit); // Add log

            // Handle different input formats
            let circuitData;
            if (Array.isArray(initialCircuit)) {
                circuitData = { gates: initialCircuit };
            } else if (initialCircuit.circuit) {
                circuitData = { gates: initialCircuit.circuit };
            } else {
                circuitData = initialCircuit;
            }

            console.log('Processed circuit data:', circuitData); // Add log

            const gates = circuitData.gates || [];

            let maxQubit = 0;
            gates.forEach(g => {
                // If it is a new format (using wires), convert to internal format
                if (g.wires) {
                    const wires = Array.isArray(g.wires) ? g.wires.map(Number) : [Number(g.wires)];
                    maxQubit = Math.max(maxQubit, ...wires);
                } else {
                    const wires = [
                        ...(g.target || []).map(Number),
                        ...(g.control || []).map(Number)
                    ];
                    maxQubit = Math.max(maxQubit, ...wires);
                }
            });

            // Convert the format of the gate
            const convertedGates = gates.map((g, index) => {
                let gate;
                if (g.wires) {
                    // Convert new format to internal format
                    gate = {
                        id: g.id || nanoid(6),
                        type: g.gate.toUpperCase(),  // Ensure gate type is uppercase
                        target: Array.isArray(g.wires) ? [g.wires[g.wires.length - 1]].map(Number) : [Number(g.wires)],
                        control: Array.isArray(g.wires) ? g.wires.slice(0, -1).map(Number) : [],
                        params: g.params || [],
                        timeStep: index
                    };
                } else {
                    // Old format, ensure all fields exist
                    gate = {
                        ...g,
                        id: g.id || nanoid(6),
                        type: (g.type || g.gate || '').toUpperCase(),  // Ensure gate type is uppercase
                        target: (g.target || []).map(Number),
                        control: (g.control || []).map(Number),
                        params: g.params || [],
                        timeStep: index
                    };
                }

                // Ensure type field exists and is correct
                if (!gate.type && gate.gate) {
                    gate.type = gate.gate.toUpperCase();
                }

                console.log('Converted gate:', gate); // Add log
                return gate;
            });

            // Keep the original number of qubits unless the imported circuit requires more
            const numQubits = Math.max(
                circuit.qubits || 4,  // Default 4 qubits
                circuitData.qubits || 0,  // Number specified by imported circuit
                maxQubit + 1  // Calculate according to the maximum index used by the gate
            );

            console.log('Converted circuit:', { qubits: numQubits, gates: convertedGates }); // Add log
            replaceCircuit({ qubits: numQubits, gates: convertedGates });
        }
    }, [initialCircuit, readOnly, replaceCircuit]);

    /* ---------- DnD ---------- */
    const [hover, setHover] = useState(null);

    const [, dropRef] = useDrop(
        () => ({
            accept: ItemTypes.GATE,
            hover: (_, monitor) => {
                const pt = monitor.getClientOffset();
                if (pt) setHover(pointToCoord(pt));
            },
            drop: (item, monitor) => {
                const pt = monitor.getClientOffset();
                if (pt) addGateAt(item.type, pointToCoord(pt));
                setHover(null);
            },
            collect: m => { if (!m.isOver()) setHover(null); },
        }),
        [circuit.qubits]
    );

    const setRefs = node => { cvsRef.current = node; dropRef(node); };

    const pointToCoord = ({ x, y }) => {
        const rect = cvsRef.current.getBoundingClientRect();
        const { scrollLeft, scrollTop } = cvsRef.current;
        // The x coordinate needs to subtract the ID column width 64px to ensure col strictly aligns with the time step
        const col = Math.floor((x + scrollLeft - rect.left - 64) / GRID);
        const row = Math.floor((y + scrollTop - rect.top) / GRID);
        return { col, row };
    };

    /* ---------- Add gate ---------- */
    const addGateAt = (type, { row, col }) => {
        if (row < 0 || row >= circuit.qubits || col < 0 || col >= MAX_COLS) return;

        const params = GATE_DEFS[type].params?.map(p => p.default ?? 0);
        const needsCtl = ['CNOT', 'CZ', 'SWAP'].includes(type);

        // For gates that require control points, a control point is added above the target by default
        let control;
        if (needsCtl) {
            control = [row > 0 ? row - 1 : row + 1];
        }

        addGate({
            id: nanoid(6),
            type,
            target: [row],
            control,
            params,
            timeStep: col,
        });
    };

    const handleGateSelect = (gate) => {
        setSelectedGate(gate);
        onSelectGate?.(gate);
    };

    const handleCanvasClick = (e) => {
        if (e.target === e.currentTarget) {
            setSelectedGate(null);
            onSelectGate?.(null);
        }
    };

    // Handle control point update
    const handleUpdateControl = (gateId, newControl) => {
        updateGate(gateId, { control: newControl });
    };

    // Generate time step markers
    const timeSteps = Array.from({ length: MAX_COLS }, (_, i) => i);

    /* ---------- render ---------- */
    return (
        <div className="flex flex-col h-full min-h-[250px] overflow-hidden">
            {/* Outer gray rounded solid line box, contains ID row and circuit diagram area */}
            <div className="border-2 border-gray-400 rounded-lg m-2 overflow-hidden flex flex-col flex-grow">
                {/* Top time step markers */}
                <div className="relative py-3 px-10 bg-gray-50 border-b border-gray-300" style={{ height: 70 }}>
                    <div className="absolute left-0 w-20 text-center text-gray-600 text-sm font-medium" style={{ top: 0, bottom: 0, lineHeight: '40px' }}>
                        ID
                    </div>
                    {timeSteps.map(t => (
                        <div
                            key={t}
                            className="absolute text-center text-gray-600 text-sm font-medium"
                            style={{
                                left: t * GRID + 64 + GRID / 2,
                                top: 0,
                                width: 80,
                                transform: 'translateX(-50%)',
                                lineHeight: '40px'
                            }}
                        >
                            t{t}
                        </div>
                    ))}
                </div>

                {/* Main circuit area */}
                <div
                    ref={setRefs}
                    className="relative flex-1 overflow-auto bg-white p-6"
                    onClick={handleCanvasClick}
                    style={{
                        height: Math.max(circuit.qubits * GRID + 60, 180),
                        minHeight: "180px"
                    }}
                >
                    {/* Qubit labels and tracks */}
                    {Array.from({ length: circuit.qubits }).map((_, r) => (
                        <div
                            key={r}
                            className="absolute left-0 flex items-center w-full"
                            style={{ top: r * GRID + GRID / 2 }}
                        >
                            <span className="mr-4 select-none text-base font-medium text-gray-600 w-12 text-right">
                                {`q${r}:`}
                            </span>
                            <div className="flex-1 border-t-2 border-gray-400" />
                        </div>
                    ))}

                    {/* Time step auxiliary vertical lines */}
                    {timeSteps.map(col => (
                        <div
                            key={col}
                            className="absolute top-0 left-0 h-full border-l border-gray-200 pointer-events-none"
                            style={{ left: col * GRID + 64 + GRID / 2 }}
                        />
                    ))}

                    {/* Hover tooltip */}
                    {hover && hover.row >= 0 && hover.row < circuit.qubits && (
                        <div
                            className="pointer-events-none absolute rounded border-2 border-blue-500/50 bg-blue-300/20"
                            style={{
                                left: hover.col * GRID + 64,
                                top: hover.row * GRID,
                                width: GRID,
                                height: GRID,
                            }}
                        />
                    )}

                    {/* Gates */}
                    {circuit.gates.map(g => (
                        <Gate
                            key={g.id}
                            gate={g}
                            onSelect={handleGateSelect}
                            onUpdateControl={handleUpdateControl}
                        />
                    ))}

                    {/* Toolbar */}
                    {selectedGate && (
                        <GateActions
                            gate={selectedGate}
                            onEdit={() => {
                                onOpenDrawer?.();
                            }}
                            onDelete={() => {
                                removeGate(selectedGate.id);
                                setSelectedGate(null);
                                onSelectGate?.(null);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Bottom tip text */}
            <div className="text-center text-sm text-gray-500 p-3 border-t">
                {hasUploadedFile && (
                    <div className="mb-2 text-blue-600">
                        The code was uploaded and is available for benchmarking under the name <span className="text-black font-bold">{fileName || 'Circuit'}</span>
                    </div>
                )}
                <div>Drag the quantum gate onto the grid to place it. Drag the control point to change its position.</div>
            </div>
        </div>
    );
}
