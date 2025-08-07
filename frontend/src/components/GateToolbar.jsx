// src/components/GateToolbar.jsx
// import {
//     PiPencil,
//     PiInfo,
//     PiMagnifyingGlassPlus,
//     PiScissors,
//     PiCopy,
//     PiTrash,
// } from "react-icons/pi";

// /**
//  * @param {object} props
//  * @param {boolean} props.visible Whether to show
//  * @param {number}  props.x       Absolute position left
//  * @param {number}  props.y       Absolute position top
//  * @param {() => void} props.onEdit
//  * @param {() => void} props.onDelete
//  */
// export default function GateToolbar({ visible, x, y, onEdit, onDelete }) {
//     if (!visible) return null;

//     return (
//         <div
//             className="absolute flex gap-1 bg-white/80 backdrop-blur-sm border
//                  rounded-md p-1 shadow"
//             style={{ top: y, left: x }}
//         >
//             <IconBtn Icon={PiPencil} title="Edit" onClick={onEdit} />
//             <IconBtn Icon={PiInfo} title="Info" onClick={() => { }} />
//             <IconBtn Icon={PiMagnifyingGlassPlus} title="Zoom" onClick={() => { }} />
//             <IconBtn Icon={PiScissors} title="Cut" onClick={() => { }} />
//             <IconBtn Icon={PiCopy} title="Copy" onClick={() => { }} />
//             <IconBtn Icon={PiTrash} title="Delete" onClick={onDelete} />
//         </div>
//     );
// }

// function IconBtn({ Icon, title, onClick }) {
//     return (
//         <button
//             type="button"
//             title={title}
//             onClick={onClick}
//             className="w-6 h-6 grid place-items-center hover:bg-gray-100 rounded"
//         >
//             <Icon className="text-[14px]" />
//         </button>
//     );
// }


import React from "react";
import { PiPencil, PiTrash } from "react-icons/pi";
import { GATE_DEFS } from '@/constants/gates';

export default function GateToolbar({ onGateSelect }) {
    const handleGateClick = (gateType) => {
        const gateDef = GATE_DEFS[gateType];
        if (!gateDef) return;

        // Create a new gate object
        const newGate = {
            type: gateType,
            params: gateDef.params?.map(param => param.default ?? 0) || [],
            id: `temp-${Date.now()}` // Temporary ID
        };

        onGateSelect(newGate);
    };

    return (
        <div className="flex flex-col items-center p-2 gap-2">
            {Object.entries(GATE_DEFS).map(([type, def]) => (
                <button
                    key={type}
                    onClick={() => handleGateClick(type)}
                    className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white font-bold transition-colors"
                    title={def.description || type}
                >
                    {type}
                </button>
            ))}
        </div>
    );
}

/* Small icon button */
function IconBtn({ Icon, onClick, tip, className = "" }) {
    return (
        <button
            onClick={onClick}
            title={tip}
            className={`w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded ${className}`}
        >
            <Icon size={14} />
        </button>
    );
}
