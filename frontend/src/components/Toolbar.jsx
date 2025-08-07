import { useRef } from 'react';
import { toPng, toSvg } from 'html-to-image';
import { useCircuit } from '@/contexts/CircuitContext';
import { encodingAPI, runAPI } from '@/services/api';

/* Download tool */
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
        replaceCircuit         /* ← For import */
    } = useCircuit();

    /* ---------- Export ---------- */
    const exportJSON = () => {
        // 1. Get pure JS object from Context
        const data = exportCircuit();
        // 2. Pretty-print as string
        const text = JSON.stringify(data, null, 2);
        // 3. Wrap with Blob and provide correct MIME type
        const blob = new Blob([text], { type: 'application/json' });
        // 4. Generate temporary URL and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.json';
        a.click();
        // 5. Release URL to prevent memory leak
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
            e.target.value = ''; // Allow repeated import of the same file
        }
    };

    /* ---------- Upload to Backend ---------- */
    const uploadToBackend = async () => {
        try {
            const circuitData = exportCircuit('export');
            const payload = {
                name: 'Circuit Upload',
                circuit: circuitData
            };
            const result = await encodingAPI.validateCircuit(payload);
            
            if (result.valid) {
                alert('Circuit uploaded successfully!');
            } else {
                alert('Circuit validation failed: ' + result.errors.join(', '));
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
    };

    /* ---------- Run Benchmark ---------- */
    const runBenchmark = async () => {
        try {
            const circuitData = exportCircuit();
            
            // First validate and upload the circuit
            const validationResult = await encodingAPI.validateCircuit(circuitData);
            if (!validationResult.valid) {
                alert('Circuit validation failed: ' + validationResult.errors.join(', '));
                return;
            }

            // Start benchmark run (using default dataset and ansatz for now)
            const benchmarkRequest = {
                encoding_id: 1, // You might want to get this from the validation result
                ansatz_id: 1,   // Default ansatz
                data_id: 1      // Default dataset
            };

            const runResult = await runAPI.startBenchmark(benchmarkRequest);
            alert(`Benchmark started successfully! Run ID: ${runResult.id}`);
            
        } catch (error) {
            alert('Benchmark failed: ' + error.message);
        }
    };

    /* ---------- Style button ---------- */
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

            <Btn onClick={uploadToBackend}>Upload to Backend</Btn>
            <Btn onClick={runBenchmark}>Run Benchmark</Btn>
        </div>
    );
}
