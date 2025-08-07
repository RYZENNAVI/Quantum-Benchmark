import React, { useState, useMemo, useEffect } from 'react';
import CircuitCanvas from '@/components/CircuitCanvas';
import {
  Database,
  Activity,
  Grid,
  Eye,
  Maximize2,
  X,
  Plus,
  Trash2,
  PlayCircle,
  Loader2,
  HelpCircle
} from 'lucide-react';

const COLORS = [
  'border-blue-600',
  'border-green-600',
  'border-purple-600',
  'border-yellow-500',
  'border-teal-500'
];

export default function BenchmarkOverview({ onShowTutorial }) {
  const [groups, setGroups] = useState([
    { id: crypto.randomUUID(), dataset: [], ansatz: [], baseline: [], color: COLORS[0] }
  ]);
  const [activeId, setActiveId] = useState(groups[0].id);
  const [modal, setModal] = useState({ item: null, isFull: false });
  const [loading, setLoading] = useState(false);
  const [lastCircuit, setLastCircuit] = useState(null);

  // Zustand: Daten vom Backend speichern
  const [datasets, setDatasets] = useState([]);
  const [ansatze, setAnsatze] = useState([]);
  const [encodings, setEncodings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // Vorher gespeicherten Schaltkreis laden
  useEffect(() => {
    const fileName = localStorage.getItem('lastCircuitFile');
    const circuitData = localStorage.getItem('lastCircuitData');
    if (fileName && circuitData) {
      setLastCircuit({
        name: fileName,
        data: JSON.parse(circuitData)
      });
    }
  }, []);

  // Ressourcendaten abrufen
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        // Direkt GET-Request verwenden um alle Ressourcen abzurufen
        const response = await fetch('/api/resources');

        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Ressourcen: ${response.status}`);
        }

        const data = await response.json();

        // Datenstruktur validieren
        if (!data || typeof data !== 'object') {
          throw new Error('Ungültiges Antwortformat');
        }

        // Notwendige Datenfelder validieren
        if (!data.datasets && !data.data) {
          throw new Error('Keine Datensätze in der Antwort gefunden');
        }
        if (!data.ansaetze) {
          throw new Error('Keine Ansätze in der Antwort gefunden');
        }
        if (!data.encodings) {
          throw new Error('Keine Encodings in der Antwort gefunden');
        }

        // Objekte in Array-Format konvertieren, einheitlich datasets verwenden
        const datasetsArray = Object.entries(data.datasets || data.data || {}).map(([id, item]) => ({
          id,
          ...item
        }));
        const ansatzeArray = Object.entries(data.ansaetze || {}).map(([id, item]) => ({
          id,
          ...item
        }));
        const encodingsArray = Object.entries(data.encodings || {}).map(([id, item]) => ({
          id,
          ...item
        }));

        setDatasets(datasetsArray);
        setAnsatze(ansatzeArray);
        setEncodings(encodingsArray);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        setDataError(error.message || 'Fehler beim Laden der Daten vom Server');
        setDatasets([]);
        setAnsatze([]);
        setEncodings([]);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeGroup = groups.find(g => g.id === activeId);

          // Kombinationsberechnung
  const combinations = useMemo(() => {
    const { dataset, ansatz, baseline } = activeGroup;
    const combs = [];
    dataset.forEach(d =>
      ansatz.forEach(a =>
        baseline.forEach(b =>
          combs.push({ dataset: d, ansatz: a, baseline: b })
        )
      )
    );
    return combs;
  }, [activeGroup]);

  const openModal = (item, type) =>
    setModal({ item: { ...item, type }, isFull: false });
  const closeModal = () =>
    setModal({ item: null, isFull: false });

  const addGroup = () => {
    const newId = crypto.randomUUID();
    const color = COLORS[groups.length % COLORS.length];
    setGroups(prev => [
      ...prev,
      { id: newId, dataset: [], ansatz: [], baseline: [], color }
    ]);
    setActiveId(newId);
  };

  const removeGroup = id => {
    if (groups.length === 1) return;
    setGroups(prev => {
      const filtered = prev.filter(g => g.id !== id);
      if (activeId === id) setActiveId(filtered[0].id);
      return filtered;
    });
  };

  const toggleSelect = (item, type) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id !== activeId) return g;
        const arr = g[type];
        const exists = arr.some(x => x.id === item.id);
        return {
          ...g,
          [type]: exists
            ? arr.filter(x => x.id !== item.id)
            : [...arr, item]
        };
      })
    );
  };

  const startBenchmark = async () => {
    if (!lastCircuit) {
      alert('Bitte entwerfen Sie zuerst einen Schaltkreis im Visual Editor und speichern Sie ihn, oder laden Sie einen Schaltkreis von der Upload-Seite hoch.');
      return;
    }

    setLoading(true);
    try {
              // Worker-Status prüfen - wenn API nicht existiert, Prüfung überspringen
      try {
        const workerStatusResponse = await fetch('/api/worker/status');
        if (workerStatusResponse.ok) {
          const workerStatus = await workerStatusResponse.json();
          if (!workerStatus.healthy) {
            throw new Error('Worker-Service ist nicht gesund. Bitte warten Sie einen Moment oder kontaktieren Sie den Administrator.');
          }
        }
      } catch (workerError) {
        console.warn('Worker status check failed, continuing anyway:', workerError);
        // Wenn Worker-Status-Prüfung fehlschlägt, trotzdem fortfahren, aber Warnung anzeigen
      }

              // Für jede Kombination Run-Aufgaben erstellen
      const runs = [];
      groups.forEach(g =>
        g.dataset.forEach(d =>
          g.ansatz.forEach(a =>
            g.baseline.forEach(b =>
              runs.push({
                encoding_id: b.id,
                ansatz_id: a.id,
                data_id: d.id,
                measure_index: 0,
                qubit_count: lastCircuit.data.length > 0 ? Math.max(...lastCircuit.data.flatMap(gate => Array.isArray(gate.wires) ? gate.wires : [])) + 1 : 1,
                n_qubits: lastCircuit.data.length > 0 ? Math.max(...lastCircuit.data.flatMap(gate => Array.isArray(gate.wires) ? gate.wires : [])) + 1 : 1,
                n_layers: 2,
                circuit: {
                  name: lastCircuit.name || '',
                  circuit: lastCircuit.data,
                  parameters: [],
                  inputs: Array.from({ length: lastCircuit.data.length > 0 ? Math.max(...lastCircuit.data.flatMap(gate => Array.isArray(gate.wires) ? gate.wires : [])) + 1 : 1 }, (_, i) => `input_${i}`),
                  qubit_count: lastCircuit.data.length > 0 ? Math.max(...lastCircuit.data.flatMap(gate => Array.isArray(gate.wires) ? gate.wires : [])) + 1 : 1
                }
              })
            )
          )
        )
      );

                // Run-Aufgabe erstellen
      const runPromises = runs.map(async (run) => {
        const response = await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(run)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Fehler beim Erstellen des Runs: ${errorData.detail || response.statusText}`);
        }
        
        return response.json();
      });

      const results = await Promise.all(runPromises);

              // Run-IDs in localStorage speichern
      const runIds = results.map(result => result.id);
              // Vorherige IDs speichern
      const prevIds = localStorage.getItem('benchmarkRunIds');
      if (prevIds) {
        localStorage.setItem('lastBenchmarkRunIds', prevIds);
      }
              // Aktuelle IDs speichern
      localStorage.setItem('benchmarkRunIds', JSON.stringify(runIds));
      
              // Benchmark-Startzeit aufzeichnen
      const startTime = Date.now();
      localStorage.setItem('benchmarkStartTime', startTime.toString());

      console.log('Benchmark runs created:', results);
      
              // Erfolgsmeldung anzeigen
      const successMessage = `✅ Erfolgreich ${results.length} Benchmark-Laufaufgaben erstellt!\n\n📋 Nächste Schritte:\n• Die Verarbeitung kann einige Minuten dauern\n• Sie können den Fortschritt auf der Ergebnisseite verfolgen\n• Falls Probleme auftreten, überprüfen Sie die Worker-Logs\n\n⚠️ Hinweis: Falls die Verarbeitung hängt, könnte es ein Worker-Problem geben.`;
      alert(successMessage);

              // Zur Ergebnisseite weiterleiten
      window.location.href = '/results';
    } catch (err) {
      console.error('Benchmark error:', err);
      
              // Detailliertere Fehlerinformationen bereitstellen
      let errorMessage = 'Fehler beim Starten des Benchmarks';
      
      if (err.message.includes('Worker-Service')) {
        errorMessage = err.message;
      } else if (err.message.includes('Fehler beim Erstellen des Runs')) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.';
      } else {
        errorMessage = `Unerwarteter Fehler: ${err.message}`;
      }
      
      alert(`❌ ${errorMessage}\n\nBitte versuchen Sie es erneut oder kontaktieren Sie den Administrator.`);
    } finally {
      setLoading(false);
    }
  };

  const btnClass = isSel =>
    `px-3 py-1 text-sm rounded font-medium transition border focus:outline-none ` +
    (isSel
      ? 'bg-gray-200 text-gray-800 border-gray-300'
      : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100');
  const infoClass = 'p-1 hover:bg-gray-100 rounded';
  const sectionBase = 'flex-1 bg-white shadow rounded-lg p-4 mb-4 min-h-[400px]';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
              <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900 text-3xl font-bold">Benchmark-Komponenten</h1>
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

      {/* 显示当前使用的电路 */}
      {lastCircuit && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Aktueller Schaltkreis</h2>
          <p className="text-gray-600">{lastCircuit.name}</p>
        </div>
      )}

      {/* 组标签 */}
      <div className="flex items-center mb-6 space-x-2">
        {groups.map((g, idx) => {
          const isActive = g.id === activeId;
          return (
            <div key={g.id} className="relative">
              <button
                onClick={() => setActiveId(g.id)}
                className={`
                  px-5 py-2 text-lg font-bold rounded-t-md
                  ${g.color} border-b-4
                  ${isActive ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-800 hover:bg-gray-50'}
                  transition
                `}
              >
                Gruppe {idx + 1}
              </button>
              {groups.length > 1 && (
                <button
                  onClick={() => removeGroup(g.id)}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                  title="Gruppe löschen"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addGroup}
          className="p-2 bg-white hover:bg-gray-100 rounded-full"
          title="Gruppe hinzufügen"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 选择部分 */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Data-Sets */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Data-Sets</h2>
          </div>
          {dataLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Wird geladen...</span>
            </div>
          ) : dataError ? (
            <div className="p-4 text-red-600 bg-red-50 rounded">
              {dataError}
            </div>
          ) : datasets.length === 0 ? (
            <div className="p-4 text-gray-600 bg-gray-50 rounded">
              Keine Datensätze verfügbar
            </div>
          ) : (
            <ul className="space-y-3">
              {datasets.map(d => {
                const isSel = activeGroup.dataset.some(x => x.id === d.id);
                return (
                  <li key={d.id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <span className="text-gray-900 font-medium">{d.name}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openModal(d, 'dataset')} className={infoClass} title="Details anzeigen">
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>
                      <button onClick={() => toggleSelect(d, 'dataset')} className={btnClass(isSel)}>
                        {isSel ? 'Ausgewählt' : 'Auswählen'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Ansätze */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Ansätze</h2>
          </div>
          {dataLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Wird geladen...</span>
            </div>
          ) : dataError ? (
            <div className="p-4 text-red-600 bg-red-50 rounded">
              {dataError}
            </div>
          ) : ansatze.length === 0 ? (
            <div className="p-4 text-gray-600 bg-gray-50 rounded">
              Keine Ansätze verfügbar
            </div>
          ) : (
            <ul className="space-y-3">
              {ansatze.map(a => {
                const isSel = activeGroup.ansatz.some(x => x.id === a.id);
                return (
                  <li key={a.id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <span className="text-gray-900 font-medium">{a.name || `Ansatz ${a.id}`}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openModal(a, 'ansatz')} className={infoClass} title="Details anzeigen">
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>
                      <button onClick={() => toggleSelect(a, 'ansatz')} className={btnClass(isSel)}>
                        {isSel ? 'Ausgewählt' : 'Auswählen'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Referenz-Encodings */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Grid className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Referenz-Encodings</h2>
          </div>
          {dataLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Wird geladen...</span>
            </div>
          ) : dataError ? (
            <div className="p-4 text-red-600 bg-red-50 rounded">
              {dataError}
            </div>
          ) : encodings.length === 0 ? (
            <div className="p-4 text-gray-600 bg-gray-50 rounded">
              Keine Encodings verfügbar
            </div>
          ) : (
            <ul className="space-y-3">
              {encodings.map(b => {
                const isSel = activeGroup.baseline.some(x => x.id === b.id);
                return (
                  <li key={b.id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                    <span className="text-gray-900 font-medium">{b.name || `Encoding ${b.id}`}</span>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openModal(b, 'baseline')} className={infoClass} title="Details anzeigen">
                        <Eye className="w-5 h-5 text-gray-500" />
                      </button>
                      <button onClick={() => toggleSelect(b, 'baseline')} className={btnClass(isSel)}>
                        {isSel ? 'Ausgewählt' : 'Auswählen'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* 组合显示 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Kombinationen in Gruppe {groups.findIndex(g => g.id === activeId) + 1}
        </h2>
        {combinations.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combinations.map((c, i) => (
              <div
                key={i}
                className={`border-l-4 ${activeGroup.color} bg-white shadow p-4 rounded`}
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Datensatz: {c.dataset.name}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Ansatz: {c.ansatz.name}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Encoding: {c.baseline.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            Bitte wählen Sie mindestens einen Datensatz, einen Ansatz und ein Encoding aus
          </p>
        )}
      </div>

      {/* 启动按钮 */}
      <div className="mb-6 text-center">
        <button
          onClick={startBenchmark}
          disabled={
            groups.some(g => !g.dataset.length || !g.ansatz.length || !g.baseline.length) ||
            loading
          }
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Wird ausgeführt...' : 'Benchmark starten'}
        </button>
      </div>

      {/* 模态窗口 */}
      {modal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`bg-white rounded-xl shadow-xl p-6 ${modal.isFull ? 'fixed inset-0 w-full h-full max-w-none' : 'w-full max-w-lg'}`}>
            <div className="flex justify-between items-center mb-4 space-x-4">
              <h3 className="text-2xl font-bold text-gray-900">{modal.item.name}</h3>
              <div className="flex items-center space-x-2">
                {!modal.isFull && (
                  <button onClick={() => setModal(prev => ({ ...prev, isFull: true }))} className="text-gray-500 hover:text-gray-700" title="Vollbild">
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" title="Schließen">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-900 mb-4">{modal.item.description}</p>
            {modal.item.type === 'dataset' && (
              <div className="grid grid-cols-3 gap-4 mb-4 text-gray-900">
                <div><strong>Proben</strong><p>{modal.item.samples}</p></div>
                <div><strong>Merkmale</strong><p>{modal.item.features}</p></div>
                <div><strong>Klassen</strong><p>{modal.item.classes}</p></div>
              </div>
            )}
            {(modal.item.type === 'ansatz' || modal.item.type === 'baseline') && modal.item.circuit && (
              <div className="border rounded p-2 overflow-auto" style={{ height: modal.isFull ? '70vh' : '16rem' }}>
                <CircuitCanvas key={modal.item.id} initialCircuit={modal.item.circuit} readOnly />
              </div>
            )}
            <div className="mt-6 text-right">
              <button onClick={closeModal} className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}