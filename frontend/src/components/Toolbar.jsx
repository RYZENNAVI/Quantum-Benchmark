// import { useCircuit } from '@/contexts/CircuitContext';

// export default function Toolbar() {
//     const { exportCircuit } = useCircuit();   // Fetch circuit JSON from Context

//     /** Export circuit → trigger download */
//     const handleExport = () => {
//         const blob = new Blob(
//             [JSON.stringify(exportCircuit(), null, 2)],
//             { type: 'application/json' },
//         );
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'circuit.json';
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     // Toolbar.jsx
//     const handleBenchmark = async () => {
//         const res = await fetch('http://127.0.0.1:8000/simulate_custom_circuit', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(exportCircuit()),
//         }).catch(err => {
//             alert('Unable to connect to backend: ' + err.message);
//             throw err;
//         });

//         if (!res.ok) {
//             const txt = await res.text();
//             alert(`Backend error ${res.status}:\n${txt}`);
//             return;
//         }
//         const data = await res.json();
//         alert(JSON.stringify(data, null, 2));
//     };


//     return (
//         <div className="flex gap-2 mb-4">
//             <button
//                 onClick={handleExport}
//                 className="px-4 py-2 bg-gray-200 rounded text-sm text-black"
//             >
//                 Export JSON
//             </button>

//             <button
//                 onClick={handleBenchmark}
//                 className="px-4 py-2 bg-gray-200 rounded text-sm ml-2 text-black"
//             >
//                 Run Benchmark
//             </button>
//         </div>
//     );
// }


// import { toPng, toSvg } from 'html-to-image';
// import { useCircuit } from '@/contexts/CircuitContext';

// /* Generic download */
// const save = (data, name, mime) => {
//     const href =
//         typeof data === 'string'
//             ? data
//             : URL.createObjectURL(new Blob([data], { type: mime }));
//     const a = document.createElement('a');
//     a.href = href;
//     a.download = name;
//     a.click();
// };

// export default function Toolbar() {
//     const { exportCircuit } = useCircuit();

//     /* ---------- Export ---------- */
//     const exportJSON = () =>
//         save(
//             JSON.stringify(exportCircuit(), null, 2),
//             'circuit.json',
//             'application/json'
//         );

//     const exportImage = async type => {
//         const node = document.getElementById('circuit-canvas');
//         if (!node) return alert('Canvas not found');

//         if (type === 'png') {
//             const url = await toPng(node);
//             save(await (await fetch(url)).blob(), 'circuit.png', 'image/png');
//         } else {
//             const url = await toSvg(node);
//             save(url, 'circuit.svg', 'image/svg+xml');
//         }
//     };

//     /* ---------- Benchmark ---------- */
//     const runBenchmark = async () => {
//         try {
//             const r = await fetch(
//                 'http://127.0.0.1:8000/simulate_custom_circuit',
//                 {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(exportCircuit())
//                 }
//             );
//             if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
//             const data = await r.json();
//             alert(JSON.stringify(data, null, 2));
//         } catch (e) {
//             alert('Benchmark failed: ' + e.message);
//         }
//     };

//     /* ---------- Pure style components ---------- */
//     const PrimaryBtn = props => (
//         <button
//             {...props}
//             className="rounded bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//         />
//     );

//     const GhostBtn = props => (
//         <button
//             {...props}
//             className="rounded border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-800 shadow hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
//         />
//     );

//     return (
//         <div className="flex flex-wrap gap-4 p-4 border-b bg-white">
//             <GhostBtn onClick={exportJSON}>Export JSON</GhostBtn>

//             <PrimaryBtn onClick={() => exportImage('png')}>Export PNG</PrimaryBtn>
//             <PrimaryBtn onClick={() => exportImage('svg')}>Export SVG</PrimaryBtn>

//             <PrimaryBtn onClick={runBenchmark}>Run Benchmark</PrimaryBtn>
//         </div>
//     );
// }


import { useRef } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useCircuit } from '@/contexts/CircuitContext';

/* Download helper */
function save(data, name, mime) {
    const href =
        typeof data === 'string'
            ? data
            : URL.createObjectURL(new Blob([data], { type: mime }));
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
}

export default function Toolbar() {
    const fileRef = useRef(null);
    const {
        exportCircuit,
        replaceCircuit         /* ← used for import */
    } = useCircuit();

    /* ---------- Export ---------- */
    const exportJSON = () => {
        // 1. Get plain JS object from Context
        const data = exportCircuit();
        // 2. Pretty-print to string
        const text = JSON.stringify(data, null, 2);
        // 3. Wrap with Blob and assign correct MIME type
        const blob = new Blob([text], { type: 'application/json' });
        // 4. Generate temporary URL and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.json';
        a.click();
        // 5. Revoke URL to avoid memory leak
        URL.revokeObjectURL(url);
    };

    const exportImg = async type => {
        const node = document.getElementById('circuit-canvas');
        if (!node) return alert('Canvas element not found');

        if (type === 'png') {
            const url = await toPng(node);
            save(await (await fetch(url)).blob(), 'circuit.png', 'image/png');
        } else {
            const url = await toSvg(node);
            save(url, 'circuit.svg', 'image/svg+xml');
        }
    };

    /* ---------- Import ---------- */
    const handleFile = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const obj = JSON.parse(text);

            /* Basic schema validation */
            if (typeof obj.qubits !== 'number' || !Array.isArray(obj.gates))
                throw new Error('Invalid schema: need { qubits:number, gates:[] }');

            replaceCircuit(obj);
        } catch (err) {
            alert('Import failed: ' + err.message);
        } finally {
            e.target.value = ''; // Allow re-importing the same file
        }
    };

    /* ---------- Benchmark ---------- */
    const runBenchmark = async () => {
        try {
            const r = await fetch('http://127.0.0.1:8000/simulate_custom_circuit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportCircuit())
            });
            if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
            const data = await r.json();
            alert(JSON.stringify(data, null, 2));
        } catch (e) {
            alert('Benchmark failed: ' + e.message);
        }
    };

    /* ---------- Stylized buttons ---------- */
    const Btn = ({ children, variant = 'primary', ...rest }) => {
        const style =
            variant === 'ghost'
                ? 'border border-gray-300 text-gray-800 bg-white hover:bg-gray-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700';
        return (
            <button
                className={`rounded px-5 py-2 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${style}`}
                {...rest}
            >
                {children}
            </button>
        );
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 border-b bg-slate-800">
            {/* Hide file input */}
            <input
                ref={fileRef}
                type="file"
                accept=".json"
                hidden
                onChange={handleFile}
            />

            <Btn variant="ghost" onClick={() => fileRef.current.click()}>
                Import JSON
            </Btn>
            <Btn variant="ghost" onClick={exportJSON}>
                Export JSON
            </Btn>

            <Btn onClick={() => exportImg('png')}>Export PNG</Btn>
            <Btn onClick={() => exportImg('svg')}>Export SVG</Btn>

            <Btn onClick={runBenchmark}>Run Benchmark</Btn>
        </div>
    );
}
