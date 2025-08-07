



// src/components/PaletteGate.jsx
import { useDrag } from 'react-dnd';

export const ItemTypes = { GATE: 'gate' };

/** A button in the gate library (supports drag and click events) */
export default function PaletteGate({
    value,
    label,
    className = '',
    onClick,       // Parent component's click event
    ...props       // Other props passed through
}) {
    /* ───── DnD ───── */
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ItemTypes.GATE,
            item: { type: value },
            collect: (monitor) => ({
                isDragging: monitor.isDragging()
            })
        }),
        [value]
    );

    /* Handle click: execute parent onClick */
    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button
            {...props}               // Pass through other props (aria-label, etc.)
            onClick={handleClick}    // Use our wrapped handler
            ref={drag}
            className={`
        font-bold text-white focus:outline-none
        focus:ring-1 focus:ring-white
        transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}
        ${className}
      `}
            aria-label={`Gate ${label}`}
            data-type={value}
        >
            {label}
        </button>
    );
}
