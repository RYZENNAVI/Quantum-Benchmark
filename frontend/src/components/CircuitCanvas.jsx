// src/components/CircuitCanvas.jsx
import { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { nanoid } from 'nanoid';

import Gate from '@/components/Gate.jsx';
import GateActions from '@/components/GateActions.jsx';
import GateParameterDrawer from '@/components/GateEditor/GateParameterDrawer';

import { ItemTypes } from '@/components/PaletteGate';
import { useCircuit } from '@/contexts/CircuitContext';
import { GATE_DEFS, PARAM_GATES } from '@/constants/gates';

export const GRID = 100; // 增加网格大小，使q0、q1等量子比特之间的间距更大
const MAX_COLS = 9; // t0~t8，共9列

export default function CircuitCanvas({ onSelectGate, initialCircuit, readOnly }) {
    const cvsRef = useRef(null);
    const { circuit, addGate, updateGate, removeGate, replaceCircuit } = useCircuit();

    useEffect(() => {
        if (readOnly && initialCircuit) {
            const gates = Array.isArray(initialCircuit)
                ? initialCircuit
                : initialCircuit.gates || [];

            let maxQubit = 0;
            gates.forEach(g => {
                const wires = [...(g.target || []), ...(g.control || [])];
                const maxWire = Math.max(-1, ...wires);
                if (maxWire > maxQubit) maxQubit = maxWire;
            });

            const numQubits = Array.isArray(initialCircuit)
                ? Math.max(2, maxQubit + 1)
                : initialCircuit.qubits ?? Math.max(2, maxQubit + 1);

            replaceCircuit({ qubits: numQubits, gates });
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
        // 横坐标需减去ID栏宽度64px，确保col与时间步严格对齐
        const col = Math.floor((x + scrollLeft - rect.left - 64) / GRID);
        const row = Math.floor((y + scrollTop - rect.top) / GRID);
        return { col, row };
    };

    /* ---------- 拖放时自动给受控门加 control ---------- */
    const addGateAt = (type, { row, col }) => {
        if (row < 0 || row >= circuit.qubits || col < 0 || col >= MAX_COLS) return;

        const params = GATE_DEFS[type].params?.map(p => p.default ?? 0);
        const needsCtl = ['CNOT', 'CZ', 'SWAP'].includes(type);
        const control = needsCtl ? [row === 0 ? 1 : row - 1] : undefined;

        addGate({
            id: nanoid(6),
            type,
            target: [row],
            control,
            params,
            timeStep: col,
        });
    };

    /* ---------- Gate 工具条 & 抽屉 ---------- */
    const [toolbar, setToolbar] = useState({ gate: null, x: 0, y: 0 });
    const [drawer, setDrawer] = useState({ open: false, gate: null });

    const openDrawer = g =>
        PARAM_GATES.includes(g.type) && setDrawer({ open: true, gate: g });

    const selectGate = (gate, position) => {
        if (!gate) {
            setToolbar({ gate: null, x: 0, y: 0 });
            return;
        }

        // 使用传入的位置信息
        setToolbar({
            gate,
            x: position.x,
            y: position.y
        });

        // 通知父组件
        onSelectGate?.(gate);
    };

    // 处理点击空白区域
    const handleCanvasClick = (e) => {
        // 如果点击的是画布本身（而不是其中的门），则清除工具栏
        if (e.target === e.currentTarget) {
            setToolbar({ gate: null });
            // 清除选中的门
            if (onSelectGate) {
                onSelectGate(null);
            }
        }
    };

    /* ---------- 增 / 删控制行 ---------- */
    const addControlRow = (gate, dir) => {
        const tgt = gate.target[0];
        const newRow = dir === 'above' ? tgt - 1 : tgt + 1;
        if (newRow < 0 || newRow >= circuit.qubits) return;        // 越界
        if (newRow === tgt) return;
        if (gate.control?.includes(newRow)) return;                // 已存在

        const updated = {
            ...gate,
            control: [...(gate.control ?? []), newRow].sort((a, b) => a - b),
        };
        updateGate(gate.id, { control: updated.control });
        setToolbar(t => ({ ...t, gate: updated }));

        // 更新选中的门
        if (onSelectGate) {
            onSelectGate(updated);
        }
    };

    const removeLastControl = gate => {
        if (!gate.control?.length) return;
        const control = [...gate.control];
        control.pop();                    // 移除最后一个
        updateGate(gate.id, { control });

        const updated = { ...gate, control };
        setToolbar(t => ({ ...t, gate: updated }));

        // 更新选中的门
        if (onSelectGate) {
            onSelectGate(updated);
        }
    };

    // 生成时间步标记
    const timeSteps = Array.from({ length: MAX_COLS }, (_, i) => i);

    /* ---------- render ---------- */
    return (
        <div className="flex flex-col h-full min-h-[250px] overflow-hidden">
            {/* 外层灰色圆角实线框，包含ID行和电路图区域 */}
            <div className="border-2 border-gray-400 rounded-lg m-2 overflow-hidden flex flex-col flex-grow">
                {/* 顶部时间步标记 */}
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

                {/* 主电路区域 */}
                <div
                    ref={setRefs}
                    className="relative flex-1 overflow-auto bg-white p-6"
                    onClick={handleCanvasClick}
                    style={{
                        height: Math.max(circuit.qubits * GRID + 60, 180), // 确保最小高度
                        minHeight: "180px"
                    }}
                >
                    {/* 量子比特标签和轨道 */}
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

                    {/* 时间步辅助竖线 */}
                    {timeSteps.map(col => (
                        <div
                            key={col}
                            className="absolute top-0 left-0 h-full border-l border-gray-200 pointer-events-none"
                            style={{ left: col * GRID + 64 + GRID / 2 }}
                        />
                    ))}

                    {/* Hover 提示 */}
                    {hover && hover.row >= 0 && hover.row < circuit.qubits && (
                        <div
                            className="pointer-events-none absolute rounded border-2 border-blue-500/50 bg-blue-300/20"
                            style={{
                                left: hover.col * GRID + 64, // 与ID栏宽度一致
                                top: hover.row * GRID,
                                width: GRID,
                                height: GRID,
                            }}
                        />
                    )}

                    {/* Gates */}
                    {circuit.gates.map(g => {
                        console.log('渲染门', g);
                        return (
                            <Gate
                                key={g.id}
                                gate={g}
                                onSelect={selectGate}
                            />
                        );
                    })}

                    {/* 工具条 */}
                    {toolbar.gate && (
                        <GateActions
                            x={toolbar.x}
                            y={toolbar.y}
                            gate={toolbar.gate}
                            onEdit={() => openDrawer(toolbar.gate)}
                            onDelete={() => {
                                removeGate(toolbar.gate.id);
                                setToolbar({ gate: null });
                                // 清除选中的门
                                if (onSelectGate) {
                                    onSelectGate(null);
                                }
                            }}
                            onAddCtrlAbove={() => addControlRow(toolbar.gate, 'above')}
                            onAddCtrlBelow={() => addControlRow(toolbar.gate, 'below')}
                            onRemoveCtrl={() => removeLastControl(toolbar.gate)}
                        />
                    )}

                    {/* 参数抽屉 */}
                    <GateParameterDrawer
                        gate={drawer.gate}
                        open={drawer.open}
                        onClose={() => setDrawer({ ...drawer, open: false })}
                        onSave={u => {
                            updateGate(drawer.gate.id, u);
                            // 更新选中的门的参数
                            if (onSelectGate && drawer.gate) {
                                const updatedGate = { ...drawer.gate, ...u };
                                onSelectGate(updatedGate);
                            }
                        }}
                    />
                </div>
            </div>

            {/* 底部提示文本 */}
            <div className="text-center text-sm text-gray-500 p-3 border-t">
                Ziehen Sie Gates aus der Palette und legen Sie sie auf dem Raster ab
            </div>
        </div>
    );
}
