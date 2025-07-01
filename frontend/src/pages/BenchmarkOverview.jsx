// src/pages/benchmark-overview.jsx
import React, { useState } from 'react';
import {
  SAMPLE_DATASETS,
  SAMPLE_ANSATZ,
  SAMPLE_BASELINES as BASELINE_CONST
} from '@/constants/mockBenchmarks';
import CircuitCanvas from '@/components/CircuitCanvas';
import { Database, Activity, Grid, Maximize2, X } from 'lucide-react';

export default function BenchmarkOverview() {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [selectedAnsatz, setSelectedAnsatz] = useState(null);
  const [selectedEncoding, setSelectedEncoding] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isFull, setIsFull] = useState(false);

  const sectionBase = 'flex-1 bg-white shadow rounded-lg p-4 mb-4 min-h-[400px]';
  const btnClass = () =>
    "px-3 py-1 text-sm rounded font-medium transition border bg-white text-gray-700 border-gray-400 hover:bg-gray-100";

  const openModal = (item, type) => {
    setSelected({ ...item, type });
    setIsFull(false);
  };

  const runBenchmark = async () => {
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encoding_id: selectedEncoding.id,
          ansatz_id: selectedAnsatz.id,
          dataset_id: selectedDataset.id
        })
      });
      const result = await res.json();
      alert(`Benchmark gestartet! ID: ${result.id}`);
    } catch (err) {
      alert('Fehler beim Starten des Benchmarks');
      console.error(err);
    }
  };

  const renderList = (items, type, selectedStateSetter, selectedStateGetter) =>
    items.map((item) => (
      <li
        key={item.id}
        className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${
          selectedStateGetter?.id === item.id ? 'bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'
        }`}
        onClick={() => selectedStateSetter(item)}
      >
        <span className="text-gray-900 font-medium">{item.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openModal(item, type);
          }}
          className={btnClass()}
        >
          Info
        </button>
      </li>
    ));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-gray-900 text-3xl font-bold mb-8">Benchmark-Komponenten</h1>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Data-Sets */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Data-Sets</h2>
          </div>
          <ul className="space-y-3">
            {renderList(SAMPLE_DATASETS, 'dataset', setSelectedDataset, selectedDataset)}
          </ul>
        </section>

        {/* Ansätze */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Activity className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Ansätze</h2>
          </div>
          <ul className="space-y-3">
            {renderList(SAMPLE_ANSATZ, 'ansatz', setSelectedAnsatz, selectedAnsatz)}
          </ul>
        </section>

        {/* Referenz-Encodings */}
        <section className={sectionBase}>
          <div className="flex items-center mb-4">
            <Grid className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-gray-800 text-xl font-semibold">Referenz-Encodings</h2>
          </div>
          <ul className="space-y-3">
            {renderList(BASELINE_CONST, 'baseline', setSelectedEncoding, selectedEncoding)}
          </ul>
        </section>
      </div>

      {/* Benchmark starten button */}
      {selectedDataset && selectedAnsatz && selectedEncoding && (
        <div className="text-right mt-6">
          <button
            onClick={runBenchmark}
            className="bg-black text-white px-6 py-2 rounded hover:bg-black font-medium"
          >
            Benchmark starten
          </button>
        </div>
      )}

      {/* Modal to display details */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div
            className={`bg-white rounded-xl shadow-xl p-6 ${
              isFull ? 'fixed inset-0 w-full h-full max-w-none' : 'w-full max-w-lg'
            }`}
          >
            <div className="flex justify-between items-center mb-4 space-x-4">
              <h3 className="text-2xl font-bold text-gray-900">{selected.name}</h3>
              <div className="flex items-center space-x-2">
                {!isFull && (
                  <button
                    onClick={() => setIsFull(true)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Full screen"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-900 mb-4">{selected.description}</p>

            {selected.type === 'dataset' && (
              <div className="grid grid-cols-3 gap-4 mb-4 text-gray-900">
                <div>
                  <strong>Samples</strong>
                  <p>{selected.samples}</p>
                </div>
                <div>
                  <strong>Features</strong>
                  <p>{selected.features}</p>
                </div>
                <div>
                  <strong>Klassen</strong>
                  <p>{selected.classes}</p>
                </div>
              </div>
            )}

            {(selected.type === 'ansatz' || selected.type === 'baseline') && selected.circuit && (
              <div
                className="border rounded p-2 overflow-auto"
                style={{ height: isFull ? '70vh' : '16rem' }}
              >
                <CircuitCanvas initialCircuit={selected.circuit} readOnly />
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
