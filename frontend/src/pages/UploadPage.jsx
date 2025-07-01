// src/pages/UploadPage.jsx
import React, { useState } from 'react';
import CircuitCanvas from '@/components/CircuitCanvas.jsx'; // Your existing read-only canvas
import { useCircuit } from '@/contexts/CircuitContext.jsx';
import { FiUploadCloud } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function UploadPage() {
  const navigate = useNavigate();
  const { replaceCircuit } = useCircuit();
  const [error, setError] = useState(null);
  const [fileContent, setFileContent] = useState(`{
    "qubits": 5,
    "gates": [
      {
        "id": "g1",
        "type": "RY",
        "target": [0],
        "params": ["theta_1"],
        "timeStep": 0
      }
    ]
  }`);

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      // ── Compatibility helper for new backend fields: gate / wires ──
      const normalizeGates = (gateArr = []) => gateArr.map(g => ({
        ...g,
        // Preserve both legacy and new field names so existing front-end logic keeps working
        target: g.target ?? g.wires ?? [],
        wires: g.wires ?? g.target ?? [],
        type: g.type ?? g.gate ?? g.name ?? 'UNKNOWN',
        gate: g.gate ?? g.type ?? g.name ?? 'UNKNOWN',
      }));

      let circuitObj = obj;
      // Accept both { circuit: [...] } (new) and legacy { gates: [...] } structures
      if (Array.isArray(obj.circuit)) {
        const normalized = normalizeGates(obj.circuit);
        const qubitCount = Math.max(...normalized.map(g => Math.max(...g.target))) + 1;
        circuitObj = {
          qubits: qubitCount,
          circuit: normalized,
          parameters: Array.isArray(obj.parameters) ? obj.parameters : [],
          inputs: Array.isArray(obj.inputs) ? obj.inputs : [],
        };
      }
      // Handle legacy top-level structure { qubits, gates }
      if (Array.isArray(obj.gates)) {
        circuitObj = {
          qubits: obj.qubits,
          circuit: normalizeGates(obj.gates),
          parameters: obj.parameters ?? [],
          inputs: obj.inputs ?? [],
        };
      }
      replaceCircuit(circuitObj);   // Write into Context
      setFileContent(text); // Save original JSON string
      setError(null);
    } catch (err) {
      setError(err.message);
      setFileContent(''); // Clear content to avoid showing outdated content on error
    }
  };

  // When the user manually edits JSON
  const handleTextChange = (e) => {
    const value = e.target.value;
    setFileContent(value);
    try {
      const parsed = JSON.parse(value);
      // ── Compatibility helper for new backend fields: gate / wires ──
      const normalizeGates = (gateArr = []) => gateArr.map(g => ({
        ...g,
        // Preserve both legacy and new field names so existing front-end logic keeps working
        target: g.target ?? g.wires ?? [],
        wires: g.wires ?? g.target ?? [],
        type: g.type ?? g.gate ?? g.name ?? 'UNKNOWN',
        gate: g.gate ?? g.type ?? g.name ?? 'UNKNOWN',
      }));

      let circuitObj = parsed;
      // Accept both { circuit: [...] } (new) and legacy { gates: [...] } structures
      if (Array.isArray(parsed.circuit)) {
        const normalized = normalizeGates(parsed.circuit);
        const qubitCount = Math.max(...normalized.map(g => Math.max(...g.target))) + 1;
        circuitObj = {
          qubits: qubitCount,
          circuit: normalized,
          parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
          inputs: Array.isArray(parsed.inputs) ? parsed.inputs : [],
        };
      }
      // Handle legacy top-level structure { qubits, gates }
      if (Array.isArray(parsed.gates)) {
        circuitObj = {
          qubits: parsed.qubits,
          circuit: normalizeGates(parsed.gates),
          parameters: parsed.parameters ?? [],
          inputs: parsed.inputs ?? [],
        };
      }
      if (typeof circuitObj.qubits === 'number' && Array.isArray(circuitObj.circuit)) {
        replaceCircuit(circuitObj);
        setError(null);
      } else {
        throw new Error('Invalid structure');
      }
    } catch (err) {
      setError('Invalid JSON format or structure');
    }
  };

  return (
    <div className="flex flex-row bg-gray-70 py-1 px-0 mx-auto overflow-x-hidden overflow-y-hidden w-[1600px] h-[2100px]">
      {/* Left upload card */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200 w-[450px] h-[1050px]">
        <h2 className="text-2xl font-bold text-black text-center mb-2">Encoding hochladen</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col items-center mb-4 bg-gray-50 w-[400px] h-[250px]">
          <FiUploadCloud className="text-2xl text-gray-400 mb-2" />
          <div className="mb-2 text-smfont-medium text-gray-900 ">Quantum Encoding hochladen</div>

          <button
            className="mb-2 inline-block px-9 py-1.5 bg-transparent border border-black text-black rounded-md cursor-pointer font-semibold text-base transition hover:bg-gray-400"
            onClick={() => {
              console.log("Datei Hochladen clicked");
              // Optionally trigger input click (see below)
            }}
          >
            Datei Hochladen
          </button>

          <label className="inline-block">
            <input type="file" accept=".json" onChange={handleFile} className="hidden" />
            <span className="inline-block px-9 py-2 p-2 bg-black text-white rounded-md cursor-pointer font-semibold text-base transition hover:bg-gray-800">
              Datei auswählen
            </span>
          </label>œ
          <div className="text-xs text-gray-500 mb-4 text-center">
            Ziehen Sie Ihre JSON-Datei hierher oder klicken Sie zum Auswählen
          </div>
        </div>
        {/* Error message */}
        {error && <div className="text-red-600 text-center mb-2 font-medium">{error}</div>}
        {/* Format explanation code block */}
        <textarea
          className="bg-gray-100 rounded-md p-4 text-xs text-gray-700 overflow-x-auto border border-gray-200 w-[400px] h-[650px] font-mono resize-none"
          value={fileContent}
          onChange={handleTextChange}
        />
      </div>
      {/* Right-side circuit visualization card */}
      <div className="bg-white p-4 border border-gray-200 flex-1 min-w-0 h-[1050px]">
        <h3 className="text-lg font-semibold text-black mb-4">Schaltkreis-Visualisierung</h3>

        {/* Insert "Open in Editor" button */}
        <button
          className="mb-3 px-8 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition"
          onClick={() => {
            navigate('/visual-editor');   // Navigate to editor
          }}
        >
          Im Editor öffnen
        </button>

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 h-[520px] overflow-auto">
          <CircuitCanvas readOnly={true} />
        </div>
      </div>
    </div>
  );
}