// src/pages/QuantumCircuitBuilder.jsx
import { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Code, Play, Save, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import GatePalette from '@/components/GatePalette';
import CircuitCanvas from '@/components/CircuitCanvas';
import GateDragLayer from '@/components/GateDragLayer';
import { useCircuit } from '@/contexts/CircuitContext';
import { GATE_DEFS } from '@/constants/gates';

// Define gate attribute information
const GATE_INFO = {
  H: {
    name: 'Hadamard Gate',
    description: 'Creates quantum superposition. Transforms |0⟩ to |+⟩ and |1⟩ to |-⟩',
    matrix: '1/√2 * [[1, 1], [1, -1]]'
  },
  X: {
    name: 'Pauli-X Gate',
    description: 'Quantum bit flip gate, similar to classical NOT gate',
    matrix: '[[0, 1], [1, 0]]'
  },
  Y: {
    name: 'Pauli-Y Gate',
    description: 'Rotation around Y-axis by π',
    matrix: '[[0, -i], [i, 0]]'
  },
  Z: {
    name: 'Pauli-Z Gate',
    description: 'Phase flip gate, transforms |1⟩ to -|1⟩',
    matrix: '[[1, 0], [0, -1]]'
  },
  RX: {
    name: 'RX Gate',
    description: 'Rotation around X-axis by angle θ',
    matrix: '[[cos(θ/2), -isin(θ/2)], [-isin(θ/2), cos(θ/2)]]',
    params: [{ name: 'θ', default: 0 }]
  },
  RY: {
    name: 'RY Gate',
    description: 'Rotation around Y-axis by angle θ',
    matrix: '[[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]',
    params: [{ name: 'θ', default: 0 }]
  },
  RZ: {
    name: 'RZ Gate',
    description: 'Rotation around Z-axis by angle θ',
    matrix: '[[e^(-iθ/2), 0], [0, e^(iθ/2)]]',
    params: [{ name: 'θ', default: 0 }]
  },
  CNOT: {
    name: 'Controlled-NOT Gate',
    description: 'Flips the target qubit if the control qubit is 1',
    matrix: '[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]'
  },
  CZ: {
    name: 'Controlled-Z Gate',
    description: 'Applies Z gate to target qubit if control qubit is 1',
    matrix: '[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]]'
  },
  SWAP: {
    name: 'SWAP Gate',
    description: 'Exchanges the states of two qubits',
    matrix: '[[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]'
  }
};

// Gate Properties component
const GateProperties = ({ selectedGate, updateGateParam }) => {
  if (!selectedGate) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-center p-4 text-gray-500 text-sm">
        <p>Wählen Sie ein Gate aus um dessen Eigenschaften zu bearbeiten</p>
      </div>
    );
  }

  const gateInfo = GATE_INFO[selectedGate.type] || {};
  const hasParams = selectedGate.params && selectedGate.params.length > 0 && gateInfo.params;

  return (
    <div className="p-3">
      <h3 className="font-medium text-gray-800 mb-2">{gateInfo.name || selectedGate.type}</h3>

      {gateInfo.description && (
        <p className="text-xs text-gray-600 mb-3">{gateInfo.description}</p>
      )}

      {selectedGate.target && (
        <div className="mb-2 text-xs text-gray-700">
          <span className="font-medium">Target Qubits:</span> {selectedGate.target.join(', ')}
        </div>
      )}

      {selectedGate.control && (
        <div className="mb-3 text-xs text-gray-700">
          <span className="font-medium">Control Qubits:</span> {selectedGate.control.join(', ')}
        </div>
      )}

      {hasParams && (
        <div className="mt-3 border-t border-gray-300 pt-3">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Parameters:</h4>
          {gateInfo.params.map((param, idx) => (
            <div key={idx} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{param.name}</label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="6.28"
                  step="0.01"
                  value={selectedGate.params[idx] || 0}
                  onChange={(e) => updateGateParam(idx, parseFloat(e.target.value))}
                  className="flex-1 mr-3 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="6.28"
                  step="0.01"
                  value={selectedGate.params[idx] || 0}
                  onChange={(e) => updateGateParam(idx, parseFloat(e.target.value))}
                  className="w-20 border-2 border-gray-400 rounded px-2 py-1 text-sm font-medium text-gray-800 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function QuantumCircuitBuilder() {
  const { exportCircuit, updateGate, circuit, setQubits: setCircuitQubits } = useCircuit();
  const [encodingName, setEncodingName] = useState('Amplitude Encoding');
  const [qubits, setQubits] = useState('4 Qubits');
  const [selectedGate, setSelectedGate] = useState(null);
  const canvasRef = useRef(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Synchronize qubits state
  useEffect(() => {
    const numQubits = parseInt(qubits);
    if (!isNaN(numQubits)) {
      setCircuitQubits(numQubits);
    }
  }, [qubits, setCircuitQubits]);

  // Synchronize CircuitContext qubits to local state on initialization
  useEffect(() => {
    if (circuit.qubits) {
      setQubits(`${circuit.qubits} Qubits`);
    }
  }, []);

  // Function to update gate parameters
  const updateGateParam = (paramIndex, value) => {
    if (!selectedGate || !selectedGate.params) return;

    const newParams = [...selectedGate.params];
    newParams[paramIndex] = value;

    updateGate(selectedGate.id, { params: newParams });
    setSelectedGate({ ...selectedGate, params: newParams });
  };

  // Handle gate click event on circuit diagram
  const handleGateSelect = (gate) => {
    setSelectedGate(gate);
  };

  // Show JSON function
  const showJSON = () => {
    alert(JSON.stringify(exportCircuit(), null, 2));
  };

  // Simulation function
  const simulateCircuit = async () => {
    try {
      // Export complete circuit structure from Context (including parameters / inputs)
      const { circuit: gateList, parameters, inputs } = exportCircuit();

      const payload = {
        circuit: gateList,
        parameters,
        inputs,
      };

      console.log('Sending circuit data:', payload);

      // Step 1: validate circuit
      const validateResponse = await fetch('/api/encoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Validation response status:', validateResponse.status);

      if (!validateResponse.ok) {
        const errorText = await validateResponse.text();
        console.error('Validation error:', errorText);
        throw new Error(`Validation failed: ${validateResponse.status} ${validateResponse.statusText}\n${errorText}`);
      }

      const validationResult = await validateResponse.json();
      console.log('Validation result:', validationResult);

      if (!validationResult.valid) {
        alert('Circuit validation failed:\n' + validationResult.errors.join('\n'));
        return;
      }

      // Step 3: poll for results
      const runResponse = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          encoding_id: 1,
          ansatz_id: 1,
          data_id: 1
        })
      });

      if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`Failed to retrieve results: ${runResponse.status} ${runResponse.statusText}\n${errorText}`);
      }

      const runResult = await runResponse.json();
      const runId = runResult.id;

      let attempts = 0;
      const maxAttempts = 60; // increased to 60 seconds
      const pollInterval = 1000;

      const getResults = async () => {
        const resultResponse = await fetch(`/api/run/${runId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          throw new Error(`Failed to retrieve results: ${resultResponse.status} ${resultResponse.statusText}\n${errorText}`);
        }
        return await resultResponse.json();
      };

      const pollResults = async () => {
        try {
          const result = await getResults();
          console.log('Polling result:', result);

          if (result.status === 'completed' || result.status === 'done') {
            alert('Run completed!\n' + JSON.stringify(result, null, 2));
          } else if (result.status === 'failed') {
            alert('Run failed: ' + (result.error || 'Unknown error'));
          } else if (result.status === 'progress') {
            console.log(`Progress: ${result.progress}%`);
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(pollResults, pollInterval);
            } else {
              alert('Run timed out, please check results later');
            }
          } else if (result.status === 'pending' || result.status === 'init') {
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(pollResults, pollInterval);
            } else {
              alert('Run timed out, please check if Worker is running');
            }
          } else {
            alert(`Unknown status: ${result.status}`);
          }
        } catch (error) {
          console.error('Polling error:', error);
          alert('Error while getting results: ' + error.message);
        }
      };

      setTimeout(pollResults, pollInterval);
      alert(`Circuit validation succeeded!\nTask ID: ${runId}\nRunning, please wait for results...`);

    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  // Save function
  const saveCircuit = () => {
    const raw = exportCircuit();

    if (!raw.circuit || raw.circuit.length === 0) {
      setShowErrorDialog(true);
      return;
    }

    const exportObj = {
      circuit: raw.circuit,
      parameters: raw.parameters ?? [],
      inputs: raw.inputs ?? [],
      qubits: raw.qubits,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Generate filename based on encodingName and qubits
    const fileName = `${encodingName.replace(/\s+/g, '_')}_${qubits.replace(/\s+/g, '')}.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full w-full overflow-x-hidden">
        {/* Top title and button area - style aligned with sidebar */}
        <div className="flex justify-start items-center p-4 mb-9 h-2">
          <h1 className="text-lg font-bold text-gray-800">Visual Circuit Designer</h1>
          <div className="flex space-x-2 ml-8">
            <button
              onClick={showJSON}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Code size={16} />
              <span>JSON</span>
            </button>
            <button
              onClick={simulateCircuit}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <Play size={16} />
              <span>Simulieren</span>
            </button>
            <button
              onClick={saveCircuit}
              className="flex items-center gap-2 bg-gray-800 text-white rounded px-3 py-1 text-sm font-medium hover:bg-gray-700"
            >
              <Save size={16} />
              <span>Speichern</span>
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 w-full overflow-hidden">
          {/* Left panel: circuit info, gate library, property panel */}
          <div className="flex flex-col space-y-2 h-full overflow-auto" style={{ maxWidth: 320 }}>
            {/* Circuit info - adjust size to better match image */}
            <div className="border-2 border-black p-3 rounded-md bg-white overflow-auto h-[250px]" style={{ resize: 'vertical', minHeight: '150px' }}>
              <h3 className="text-sm font-bold mb-2 text-gray-800">Circuit Info</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Encoding Name</label>
                  <input
                    type="text"
                    value={encodingName}
                    onChange={(e) => setEncodingName(e.target.value)}
                    className="w-full border rounded-md px-2 py-1 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Anzahl Qubits</label>
                  <select
                    value={qubits}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setQubits(newValue);
                      const numQubits = parseInt(newValue);
                      if (!isNaN(numQubits)) {
                        setCircuitQubits(numQubits);
                      }
                    }}
                    className="w-full border rounded-md px-2 py-1 text-sm appearance-none bg-white text-gray-800"
                  >
                    {[4, 5, 6, 7, 8].map(num => (
                      <option key={num}>{num} Qubits</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Gate library - fully resolve overlap issue */}
            <div className="border-2 border-black p-3 rounded-md bg-white h-[670px] relative" style={{ minHeight: '400px', maxWidth: 320 }}>
              <h3 className="text-sm font-bold mb-2 text-gray-800">Gate Palette</h3>

              {/* Scrollable gate container, add padding-bottom to keep bottom text visible */}
              <div className="overflow-auto h-[530px] pb-6">
                <GatePalette className="h-full" />
              </div>

              {/* Fixed text at bottom */}
              <div className="absolute bottom-2 left-0 right-0 text-xs text-gray-500 text-center bg-white border-t border-gray-100 pt-1">
                Drag & Drop Gates auf den Circuit
              </div>
            </div>

            {/* Gate properties - adjust size to better match image */}
            <div className="border-2 border-black p-3 rounded-md bg-white overflow-auto h-[280px]" style={{ resize: 'vertical', minHeight: '180px', maxWidth: 320 }}>
              <h3 className="text-sm font-bold mb-2 text-gray-800">Gate Properties</h3>
              <GateProperties selectedGate={selectedGate} updateGateParam={updateGateParam} />
            </div>
          </div>

          {/* Right: circuit design area */}
          <div className="flex-1 flex flex-col w-full">
            {/* Circuit area - entire area resizable */}
            <div className="border-2 border-black rounded-md flex-1 flex flex-col overflow-hidden" style={{ minHeight: '400px' }}>
              {/* Title area */}
              <div className="p-3 border-b flex items-center bg-gray-50">
                <Edit className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-medium text-gray-800">Circuit Designer</h2>
              </div>

              {/* Circuit canvas area */}
              <div className="flex-1 bg-white overflow-auto" ref={canvasRef}>
                <div
                  id="circuit-canvas"
                  className="h-full w-full"
                >
                  <CircuitCanvas onSelectGate={handleGateSelect} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-white border-2 border-red-600 shadow-lg">
          <DialogHeader className="bg-transparent">
            <DialogTitle className="text-2xl font-bold text-black uppercase tracking-wider">FEHLER</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-xl text-black font-semibold">Bitte exportieren Sie eine gültige JSON-Datei mit Gattern</p>
          </div>
        </DialogContent>
      </Dialog>

      <GateDragLayer />
    </DndProvider>
  );
}
