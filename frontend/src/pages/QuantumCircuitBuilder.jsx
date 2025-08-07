// src/pages/QuantumCircuitBuilder.jsx
import React, { useState, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Code, Play, Save, Edit, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PiPencil } from 'react-icons/pi';

import GatePalette from '@/components/GatePalette';
import CircuitCanvas from '@/components/CircuitCanvas';
import GateDragLayer from '@/components/GateDragLayer';
import { useCircuit } from '@/contexts/CircuitContext';
import { GATE_DEFS } from '@/constants/gates';
import GateParameterDrawer from '@/components/GateEditor/GateParameterDrawer';
import GateToolbar from '@/components/GateToolbar';

// Gate property information
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

// Gate Properties Component
const GateProperties = ({ selectedGate, onEditClick }) => {
  if (!selectedGate) {
    return (
      <div className="flex flex-col h-full justify-center items-center text-center p-4 text-gray-500 text-sm">
        <p>Wählen Sie ein Gate aus um dessen Eigenschaften zu bearbeiten</p>
      </div>
    );
  }

  const gateInfo = GATE_INFO[selectedGate.type] || {};
  const gateDef = GATE_DEFS[selectedGate.type] || {};
  const hasParams = gateDef.params && gateDef.params.length > 0;

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-800">{gateInfo.name || selectedGate.type}</h3>
        {hasParams && (
          <button
            onClick={onEditClick}
            className="p-1 hover:bg-gray-100 rounded"
            title="Edit Parameters"
          >
            <PiPencil size={16} className="text-gray-600" />
          </button>
        )}
      </div>

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
    </div>
  );
};

export default function QuantumCircuitBuilder({ onShowTutorial }) {
  const { exportCircuit, updateGate, circuit, setQubits: setCircuitQubits, setVariables: setCircuitVariables } = useCircuit();
  const navigate = useNavigate();
  const [encodingName, setEncodingName] = useState('Amplitude Encoding');
  const [qubits, setQubits] = useState('4 Qubits');
  const [variables, setVariables] = useState('4 Variables');
  const [selectedGate, setSelectedGate] = useState(null);
  const canvasRef = useRef(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isParameterDrawerOpen, setParameterDrawerOpen] = useState(false);

  // Synchronize qubits and variables state
  useEffect(() => {
    const numQubits = parseInt(qubits);
    if (!isNaN(numQubits)) {
      setCircuitQubits(numQubits);
    }
  }, [qubits, setCircuitQubits]);

  useEffect(() => {
    const numVariables = parseInt(variables);
    if (!isNaN(numVariables)) {
      setCircuitVariables(numVariables);
    }
  }, [variables, setCircuitVariables]);

  // Initialize by synchronizing CircuitContext qubits and variables to local state
  useEffect(() => {
    if (circuit.qubits) {
      setQubits(`${circuit.qubits} Qubits`);
    }
    if (circuit.variables) {
      setVariables(`${circuit.variables} Variables`);
    }
  }, []);

  // Handle gate selection
  const handleGateSelect = (gate) => {
    setSelectedGate(gate);
  };

  // Handle parameter updates
  const handleParamUpdate = (index, value) => {
    if (!selectedGate) return;

    console.log('Parameter update called:', { index, value, selectedGate });

    // Create new parameter array
    const newParams = [...(selectedGate.params || [])];
    newParams[index] = value;

    // Update gate in circuit
    updateGate(selectedGate.id, {
      ...selectedGate,
      params: newParams
    });

    // Update selected gate state
    setSelectedGate(prevGate => ({
      ...prevGate,
      params: newParams
    }));
  };

  // Display JSON function
  const showJSON = () => {
    // Get circuit data in export format
    const exportData = exportCircuit('export');
    // Payload erstellen, der mit dem Backend übereinstimmt
    const payload = {
      name: encodingName,
      circuit: exportData
    };
    alert(JSON.stringify(payload, null, 2));
  };

  // Save function
  const saveCircuit = () => {
    // Get circuit data in export format
    const exportData = exportCircuit('export');

    // Check if there are any gates
    if (!exportData || exportData.length === 0) {
      setShowErrorDialog(true);
      return;
    }

    // Payload erstellen, der mit dem Backend übereinstimmt
    const payload = {
      name: encodingName,
      circuit: exportData
    };

    // Use the exported payload directly
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Generate filename based on encodingName and qubits
    const fileName = `${encodingName.replace(/\s+/g, '_')}_${qubits.replace(/\s+/g, '')}.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // Dateiname in localStorage speichern, für Benchmark-Seite verwenden
    localStorage.setItem('lastCircuitFile', fileName);
    localStorage.setItem('lastCircuitData', JSON.stringify(payload));

    // Benutzer fragen, ob er zur Benchmark-Seite wechseln möchte
    if (confirm('Schaltung wurde gespeichert! Möchten Sie zur Benchmark-Seite wechseln?')) {
      navigate('/benchmark');
    }

    return fileName;
  };

  // Simulation function
  const simulateCircuit = async () => {
    try {
      // Get circuit data in export format
      const exportData = exportCircuit('export');
      // Payload erstellen
      const payload = {
        name: encodingName,
        circuit: exportData
      };
      // Step 1: Validate circuit
      const validateResponse = await fetch('/api/encoding/', {
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
        alert('Schaltungsvalidierung fehlgeschlagen:\n' + validationResult.errors.join('\n'));
        return;
      }

      // Benutzer zur Auswahl auffordern: Schnelltest oder zu Benchmark wechseln
      if (confirm('Schaltung erfolgreich validiert!\n\nWählen Sie eine Option:\n- OK: Schnelltest mit Standardkonfiguration\n- Abbrechen: Schaltung speichern und zur Benchmark-Seite wechseln')) {
        // Schnelltest: Standardkonfiguration verwenden
        const timestamp = Date.now();
        const actualQubits = circuit.qubits || 4;
        const actualVariables = circuit.variables || 4;
        const runResponse = await fetch(`/api/run?t=${timestamp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            encoding_id: 1,
            ansatz_id: 1,
            data_id: 1,
            measure_index: 0,
            qubit_count: actualQubits,
            variable_count: actualVariables,
            n_layers: 2,  // n_layers Parameter an die richtige Position hinzufügen
            circuit: {
              circuit: exportData, // Use exportData directly
              parameters: [],
              inputs: Array.from({ length: actualVariables }, (_, i) => `input_${i}`),
              qubit_count: actualQubits,
              variable_count: actualVariables,
              wires: actualQubits  // wires verwenden statt n_wires
            }
          })
        });

        if (!runResponse.ok) {
          const errorText = await runResponse.text();
          throw new Error(`Ausführung fehlgeschlagen: ${runResponse.status} ${runResponse.statusText}\n${errorText}`);
        }

        const runResult = await runResponse.json();
        const runId = runResult.id;

        // Run-ID speichern
        localStorage.setItem('quickTestRunId', runId);

        // Direkt zur Ergebnisseite weiterleiten
        navigate('/results');

      } else {
        // Schaltung speichern und zu Benchmark weiterleiten
        const fileName = saveCircuit();
        if (fileName) {
          // Kurz warten um sicherzustellen, dass die Datei gespeichert wurde
          setTimeout(() => {
            navigate('/benchmark');
          }, 500);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Fehler: ' + error.message);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full w-full overflow-x-hidden">
        {/* Header title and button area - adjust style to match sidebar */}
        <div className="flex justify-start items-center p-4 mb-9 h-2">
          <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Visual Circuit Designer</h1>
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
          {/* Left panel: Circuit info, gate palette, properties panel */}
          <div className="flex flex-col space-y-2 h-full overflow-auto" style={{ maxWidth: 320 }}>
            {/* Circuit info - adjust size to match image */}
            <div className="border-2 border-black p-3 rounded-md bg-white overflow-auto h-[280px]" style={{ resize: 'vertical', minHeight: '180px' }}>
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
                    {[4, 5, 6, 7, 8, 10, 20, 50, 1000].map(num => (
                      <option key={num}>{num} Qubits</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Anzahl Variablen</label>
                  <select
                    value={variables}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setVariables(newValue);
                      const numVariables = parseInt(newValue);
                      if (!isNaN(numVariables)) {
                        setCircuitVariables(numVariables);
                      }
                    }}
                    className="w-full border rounded-md px-2 py-1 text-sm appearance-none bg-white text-gray-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 50].map(num => (
                      <option key={num}>{num} Variables</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Gate palette - completely resolve overlap issues */}
            <div className="border-2 border-black p-3 rounded-md bg-white h-[640px] relative" style={{ minHeight: '370px', maxWidth: 320 }}>
              <h3 className="text-sm font-bold mb-2 text-gray-800">Gate Palette</h3>

              {/* Scrollable gate container, add padding-bottom to ensure bottom text isn't covered */}
              <div className="overflow-auto h-[500px] pb-6">
                <GatePalette className="h-full" />
              </div>

              {/* Fixed bottom text */}
              <div className="absolute bottom-2 left-0 right-0 text-xs text-gray-500 text-center bg-white border-t border-gray-100 pt-1">
                Gatter per Drag & Drop in den Schaltkreis ziehen
              </div>
            </div>

            {/* Gate properties panel */}
            <div className="border-2 border-black p-3 rounded-md bg-white overflow-auto h-[280px]" style={{ resize: 'vertical', minHeight: '180px', maxWidth: 320 }}>
              <h3 className="text-sm font-bold mb-2 text-gray-800">Gate Properties</h3>
              <GateProperties
                selectedGate={selectedGate}
                onEditClick={() => setParameterDrawerOpen(true)}
              />
            </div>
          </div>

          {/* Right side: Circuit design area */}
          <div className="flex-1 flex flex-col w-full">
            <div className="border-2 border-black rounded-md flex-1 flex flex-col overflow-hidden" style={{ minHeight: '400px' }}>
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
                  <CircuitCanvas
                    onSelectGate={handleGateSelect}
                    onOpenDrawer={() => setParameterDrawerOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parameter editing drawer */}
        <GateParameterDrawer
          gate={selectedGate}
          open={isParameterDrawerOpen}
          onClose={() => setParameterDrawerOpen(false)}
          onUpdateParam={handleParamUpdate}
        />
      </div>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-white border-2 border-red-600 shadow-lg">
          <DialogHeader className="bg-transparent">
            <DialogTitle className="text-2xl font-bold text-black uppercase tracking-wider">ERROR</DialogTitle>
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
