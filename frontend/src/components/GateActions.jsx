// import { Edit, Copy, Trash, Plus, Minus } from 'lucide-react';

// export default function GateActions({
//     x,
//     y,
//     gate,
//     onEdit,
//     onDelete,
//     onAddCtrlAbove,
//     onAddCtrlBelow,
//     onRemoveCtrl
// }) {
//     /* 多控制时，显示删控制按钮（选中时删最近的） */
//     const canRemoveCtrl = gate?.control?.length;

//     return (
//         <div
//             style={{ left: x, top: y }}
//             className="absolute flex gap-[2px] bg-zinc-800 rounded border border-zinc-700 p-1 z-50"
//         >
//             <IconBtn Icon={Edit} tip="Edit" onClick={onEdit} />
//             <IconBtn Icon={Copy} tip="Copy" />
//             <IconBtn Icon={Plus} tip="Ctrl ↑" onClick={onAddCtrlAbove} />
//             <IconBtn Icon={Plus} tip="Ctrl ↓" onClick={onAddCtrlBelow} />
//             {canRemoveCtrl && (
//                 <IconBtn
//                     Icon={Minus}
//                     tip="Remove Ctrl"
//                     onClick={() =>
//                         onRemoveCtrl(gate.control[gate.control.length - 1])
//                     }
//                 />
//             )}
//             <IconBtn Icon={Trash} tip="Delete" onClick={onDelete} />
//         </div>
//     );
// }

// function IconBtn({ Icon, tip, ...rest }) {
//     return (
//         <button
//             className="w-5 h-5 flex items-center justify-center hover:bg-zinc-700 rounded"
//             title={tip}
//             {...rest}
//         >
//             <Icon size={12} strokeWidth={2} />
//         </button>
//     );
// }


import { Edit, Trash, Plus, Minus } from 'lucide-react';

/**
 * Floating toolbar
 * props:
 *   x, y                 — absolute positioning
 *   gate                 — currently selected Gate
 *   onEdit()             — edit drawer
 *   onDelete()           — delete gate
 *   onAddCtrlAbove()     — add control line above target
 *   onAddCtrlBelow()     — add control line below target
 *   onRemoveCtrl(row)    — remove control line
 */
export default function GateActions({
    x,
    y,
    gate,
    onEdit = () => { },
    onDelete = () => { },
    onAddCtrlAbove = () => { },
    onAddCtrlBelow = () => { },
    onRemoveCtrl = () => { },
}) {
    const canRemoveCtrl = gate?.control?.length;

    return (
        <div
            style={{ left: x, top: y }}
            className="absolute z-50 flex flex-col gap-[2px] bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded p-1"
        >
            <IconBtn Icon={Edit} tip="Bearbeiten" onClick={onEdit} />
            <IconBtn Icon={Plus} tip="Ctrl nach oben" onClick={onAddCtrlAbove} />
            <IconBtn Icon={Plus} tip="Ctrl nach unten" onClick={onAddCtrlBelow} />
            {canRemoveCtrl && (
                <IconBtn
                    Icon={Minus}
                    tip="Ctrl entfernen"
                    onClick={() =>
                        onRemoveCtrl(gate.control[gate.control.length - 1])
                    }
                />
            )}
            <IconBtn Icon={Trash} tip="Löschen" onClick={onDelete} className="text-red-400" />
        </div>
    );
}

function IconBtn({ Icon, tip, className = "", ...rest }) {
    return (
        <button
            {...rest}
            title={tip}
            className={`w-5 h-5 flex items-center justify-center hover:bg-zinc-700/80 rounded transition-colors ${className}`}
        >
            <Icon size={12} strokeWidth={2} className="text-white/90" />
        </button>
    );
}
