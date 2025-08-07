console.debug('Gate component v2025-05-11 loaded');

// src/components/Gate.jsx
import { memo, useRef, useState, useEffect } from 'react';
import { GRID } from './CircuitCanvas.jsx';
import { PARAM_GATES, GATE_COLORS } from '@/constants/gates';
import { useCircuit } from '@/contexts/CircuitContext';

const DOT_SIZE = 10;   // Control point size increased
const PLUS_SIZE = 32;  // Target circle diameter increased
const LINE_WIDTH = 3;   // Vertical line thickness increased

// Format parameter value, keep two decimal places
const formatParam = (value) => {
    if (typeof value !== 'number') return '0.00';
    return value.toFixed(2);
};

function Gate({ gate, onSelect, readOnly = false, onUpdateControl }) {
    const ref = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [draggedControl, setDraggedControl] = useState(null);
    const { circuit } = useCircuit();  // Get circuit state

    // Debug log
    useEffect(() => {
        console.log('Rendering gate:', gate);
    }, [gate]);

    // Get gate type (convert to uppercase)
    const gateType = (gate.type || gate.gate || '').toUpperCase();

    /* Unified click & double-click logic */
    const click = e => {
        if (readOnly) return;
        e.stopPropagation();
        // Select gate on single click
        onSelect?.(gate);
    };

    const dbl = e => {
        if (readOnly) return;
        e.stopPropagation();
        // Show toolbar on double click
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect) {
            const toolbarPosition = {
                x: rect.left,
                y: rect.bottom + 5
            };
            onSelect?.(gate, toolbarPosition);
        }
    };

    // Handle control point dragging
    const handleControlMouseDown = (e, controlIndex) => {
        if (readOnly) return;
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDraggedControl(controlIndex);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || readOnly) return;

        const deltaY = e.clientY - dragStartY;
        const gridDelta = Math.round(deltaY / GRID);

        if (gridDelta !== 0) {
            const control = [...(gate.control || [])];
            const newRow = control[draggedControl] + gridDelta;

            // Ensure new position is within valid range:
            // 1. Cannot be less than 0 (first row)
            // 2. Cannot exceed maximum qubit count
            // 3. Cannot overlap with other control points or target points
            if (newRow >= 0 &&
                newRow < circuit.qubits &&
                !gate.target.includes(newRow) &&
                !control.includes(newRow)) {
                control[draggedControl] = newRow;
                onUpdateControl?.(gate.id, control);
                setDragStartY(e.clientY);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggedControl(null);
    };

    // Add global mouse event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, draggedControl]);

    /* ─── Controlled gates (CNOT / CZ / SWAP) ─── */
    if (gate.control && gate.control.length > 0) {
        const minRow = Math.min(...gate.target, ...(gate.control || []));
        const maxRow = Math.max(...gate.target, ...(gate.control || []));

        // Select color based on gate type
        const gateColor = GATE_COLORS[gateType] || GATE_COLORS['default'];  // Add default color
        const lineColor = gateColor.bg;
        const borderColor = gateColor.border.replace('border-', '');

        return (
            <div
                ref={ref}
                className="absolute"
                style={{
                    left: gate.timeStep * GRID + 64,
                    top: minRow * GRID,
                    width: GRID,
                    height: (maxRow - minRow + 1) * GRID,
                }}
                onClick={click}
                onDoubleClick={dbl}
            >
                {/* Vertical line */}
                <div
                    className={`absolute ${lineColor}`}
                    style={{
                        left: (GRID - LINE_WIDTH) / 2,
                        top: GRID / 2,
                        width: LINE_WIDTH,
                        height: (maxRow - minRow) * GRID,
                    }}
                />

                {/* Control points - draggable */}
                {gate.control.map((r, index) => (
                    <div
                        key={`ctrl-${r}`}
                        className={`absolute rounded-full border-2 cursor-move border-${borderColor}`}
                        style={{
                            left: (GRID - DOT_SIZE) / 2,
                            top: (r - minRow) * GRID + GRID / 2 - DOT_SIZE / 2,
                            width: DOT_SIZE,
                            height: DOT_SIZE,
                        }}
                        onMouseDown={(e) => handleControlMouseDown(e, index)}
                    />
                ))}

                {/* Target points */}
                {gate.target.map(r => (
                    <div
                        key={`tgt-${r}`}
                        className={`absolute rounded-full border-2 flex items-center justify-center border-${borderColor}`}
                        style={{
                            left: (GRID - PLUS_SIZE) / 2,
                            top: (r - minRow) * GRID + GRID / 2 - PLUS_SIZE / 2,
                            width: PLUS_SIZE,
                            height: PLUS_SIZE,
                        }}
                    >
                        {gateType === 'SWAP' && (
                            <span className={`text-lg font-bold text-${borderColor}`}>
                                ×
                            </span>
                        )}
                        {gateType === 'CNOT' && (
                            <span className={`text-lg font-bold text-${borderColor}`}>
                                +
                            </span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    /* ─── Single qubit gates ─── */
    const gateColor = GATE_COLORS[gateType] || GATE_COLORS['default'];  // Add default color
    const colorClasses = `${gateColor.bg} ${gateColor.border}`;
    const rectStyle = {
        left: gate.timeStep * GRID + 64 + (GRID - 64) / 2,
        top: gate.target[0] * GRID + GRID / 2 - 32,
    };

    // Check if gate has parameters
    const hasParams = gate.params && gate.params.length > 0;
    const paramValue = hasParams ? gate.params[0] : null;
    const paramValueText = hasParams ? formatParam(paramValue) : '';

    return (
        <>
            {/* Gate body */}
            <div
                ref={ref}
                role="button"
                onClick={click}
                onDoubleClick={dbl}
                className={`absolute z-10 w-12 h-12 rounded-md border-2 shadow ${colorClasses}
                    flex items-center justify-center text-base font-bold text-white
                    select-none cursor-pointer`}
                style={rectStyle}
                aria-label={`Gate ${gateType}`}
            >
                {gateType}
            </div>

            {hasParams && (
                <div
                    className="absolute z-20 bg-white px-4 py-1.5 rounded-md border border-gray-400 text-xs font-medium text-gray-800 shadow-sm"
                    style={{
                        left: gate.timeStep * GRID + 64 + (GRID - 64) / 2 - 50,
                        top: gate.target[0] * GRID + GRID / 2 + 20,
                        minWidth: '80px',
                        textAlign: 'center'
                    }}
                >
                    θ={paramValueText}
                </div>
            )}
        </>
    );
}
export default memo(Gate);

