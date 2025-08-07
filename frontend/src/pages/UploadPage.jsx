import React, { useState } from 'react';
import CircuitCanvas from '@/components/CircuitCanvas.jsx';
import { useCircuit } from '@/contexts/CircuitContext.jsx';
import { FiUploadCloud } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { encodingAPI } from '@/services/api'; // Import am Anfang
import { HelpCircle } from 'lucide-react';

export default function UploadPage({ onShowTutorial }) {
  const navigate = useNavigate();
  const { replaceCircuit } = useCircuit();

  const [error, setError] = useState(null);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');

  const parseAndUpdateCircuit = (text) => {
    try {
      const obj = JSON.parse(text);
      // Unterstützt { name, circuit: [...] } Struktur
      const circuitArr = Array.isArray(obj)
        ? obj
        : Array.isArray(obj.circuit)
          ? obj.circuit
          : [];
      const gates = circuitArr.map((g, index) => ({
        id: nanoid(6),
        type: g.gate,
        target: g.wires.slice(-1),
        control: g.wires.slice(0, -1),
        params: g.params || [],
        timeStep: index
      }));

      const maxQubit = Math.max(
        2,
        ...gates.flatMap((g) => [...g.target, ...g.control])
      ) + 1;

      const circuitObj = { qubits: maxQubit, gates };
      replaceCircuit(circuitObj);
      setError(null);
      // setHasUploadedFile(true); // Hier entfernt
    } catch (err) {
      console.error('❌ Fehler beim Parsen:', err);
      setError('Ungültiges JSON oder Strukturproblem');
      setHasUploadedFile(false);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setFileContent(value);
    parseAndUpdateCircuit(value); // echzeitige Akutaliesierung
  };

  return (
    <div className="flex flex-row bg-gray-70 py-1 px-0 mx-auto overflow-x-hidden overflow-y-hidden w-[1600px] h-[2100px]">
      {/* Left upload card */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-200 w-[450px] h-[1050px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-black">Encoding hochladen</h2>
          {onShowTutorial && (
            <button
              onClick={onShowTutorial}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Tutorial anzeigen"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col items-center mb-4 bg-gray-50 w-[400px] h-[250px]">
          <FiUploadCloud className="text-2xl text-gray-400 mb-2" />
          <div className="mb-2 text-sm font-medium text-gray-900">Quantum Encoding hochladen</div>

          {/*  upload buton */}
          <button
            className="mb-2 inline-block px-9 py-1.5 bg-transparent border border-black text-black rounded-md cursor-pointer font-semibold text-base transition hover:bg-gray-400"
            onClick={async () => {
              try {
                const obj = JSON.parse(fileContent);

                // Grundlegende Strukturprüfung + robusteres Durchlaufen
                if (
                  typeof obj.name !== 'string' ||
                  !Array.isArray(obj.circuit) ||
                  !obj.circuit.every(g =>
                    g &&
                    typeof g.gate === 'string' &&
                    Array.isArray(g.wires) &&
                    (g.params === undefined || Array.isArray(g.params))
                  )
                ) {
                  setError('JSON must have { name, circuit: [ { gate, wires, params } ] } structure');
                  return;
                }

                // Fehlende params-Felder ergänzen
                obj.circuit.forEach(gate => {
                  if (!('params' in gate)) gate.params = [];
                });

                // In das vom Canvas erwartete Format konvertieren
                const gates = obj.circuit.map((g, index) => ({
                  id: nanoid(6),
                  type: g.gate,
                  target: g.wires.slice(-1),
                  control: g.wires.slice(0, -1),
                  params: g.params || [],
                  timeStep: index
                }));

                const maxQubit =
                  obj.circuit.length > 0
                    ? Math.max(...obj.circuit.flatMap(g => [...g.wires])) + 1
                    : 2;

                replaceCircuit({ qubits: maxQubit, gates });

                // 🔁 Backend-API aufrufen
                const result = await encodingAPI.validateCircuit(obj);
                if (result.valid) {
                  setHasUploadedFile(true);
                  setError(null);
                  window.alert('Upload and validation successful!');
                } else {
                  setError('Validation failed: ' + result.errors.join(', '));
                }
              } catch (err) {
                console.error('🔥 Fehler beim Parsen oder Upload:', err);
                setError('❌ JSON or Server error: ' + (err.message || 'Unbekannt'));
              }
            }}
          >
            Datei Hochladen
          </button>

          {/* select file */}
          <label className="inline-block">
            <input
              id="fileInput"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  const content = evt.target.result;
                  setFileContent(content);
                  setFileName(file.name.replace('.json', ''));
                  parseAndUpdateCircuit(content);
                };
                reader.readAsText(file);
              }}
            />
            <span className="inline-block px-9 py-2 p-2 bg-black text-white rounded-md cursor-pointer font-semibold text-base transition hover:bg-gray-800">
              Datei auswählen
            </span>
          </label>

          <div className="text-xs text-gray-500 mb-4 text-center">
            Ziehen Sie Ihre JSON-Datei hierher oder klicken Sie zum Auswählen
          </div>
        </div>

        {error && <div className="text-red-600 text-center mb-2 font-medium">{error}</div>}

        {/* JSON texteditor */}
        <textarea
          className="bg-gray-100 rounded-md p-4 text-xs text-gray-700 overflow-x-auto border border-gray-200 w-[400px] h-[650px] font-mono resize-none"
          value={fileContent}
          onChange={handleTextChange}
        />
      </div>

      {/* right canavar */}
      <div className="bg-white p-4 border border-gray-200 flex-1 min-w-0 h-[1050px]">
        <h3 className="text-lg font-semibold text-black mb-4">Schaltkreis-Visualisierung</h3>

        <div className="flex space-x-3 mb-3">
          <button
            className="px-8 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition"
            onClick={() => navigate('/visual-editor')}
          >
            Im Editor öffnen
          </button>

          <button
            className={`px-8 py-2 rounded font-semibold transition ${hasUploadedFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            onClick={() => {
              if (hasUploadedFile) navigate('/benchmark');
            }}
            disabled={!hasUploadedFile}
          >
            Zum Benchmark
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 h-[520px] overflow-auto">
          <CircuitCanvas
            readOnly={true}
            fileName={fileName}
          />
        </div>
        {/* Bottom tip text */}
        {hasUploadedFile && (
          <div className="text-center text-sm text-blue-600 mb-2">
            The code was uploaded and is available for benchmarking under the name <span className="text-black font-bold">{fileName || 'Circuit'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
