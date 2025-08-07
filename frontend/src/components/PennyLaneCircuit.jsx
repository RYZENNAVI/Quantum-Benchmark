// // src/components/PennyLaneCircuit.jsx
// import React, { useEffect, useRef } from 'react';
// import { Circuit } from 'react-quantum-circuit';
// import * as qml from 'pennylane-js';

// export default function PennyLaneCircuit({ params = [0.543] }) {
//     const qasmRef = useRef("");

//     useEffect(() => {
//         // 1) Create a QNode in browser using pennylane-js
//         const dev = new qml.device("default.qubit", { wires: 3 });
//         const circuit = new qml.QNode(
//             ({ theta }) => {
//                 qml.Hadamard({ wires: [0] }); å
//                 qml.CNOT({ wires: [0, 1] });
//                 qml.RX({ params: [theta], wires: [2] });
//                 return qml.expval(qml.PauliZ(2));
//             },
//             dev
//         );

//         // 2) Serialize to OpenQASM
//         //    pennylane-js has toQASM() — if not, can manually generate from circuit.ops
//         const qasm = qml.toOpenQASM(circuit);
//         qasmRef.current = qasm;
//     }, [params]);

//     if (!qasmRef.current) {
//         return <div>Loading circuit…</div>;
//     }

//     // 3) Hand over to react-quantum-circuit for rendering
//     return (
//         <div className="p-4 bg-background">
//             <Circuit
//                 qasm={qasmRef.current}
//                 options={{
//                     cellWidth: 40,
//                     cellHeight: 40,
//                     gateColor: "#5C6AC4",
//                 }}
//             />
//         </div>
//     );
// }
