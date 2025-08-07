import React, { useState, useEffect, useCallback } from 'react';
import { runAPI, resultAPI } from "@/services/api";
import { HelpCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

// CSV Export function
function exportToCSV(data) {
  const header = "Encoding,Dataset,Ansatz,Accuracy,Loss,Qubits,ComputeTime\n";
  const rows = data.map(
    (d) => {
      const benchmarkStartTime = localStorage.getItem('benchmarkStartTime');
      const timestamp = new Date(d.timestamp);
      let computeTime = '';
      
      if (benchmarkStartTime && d.status === 'done') {
        const startTime = parseInt(benchmarkStartTime);
        const endTime = timestamp.getTime();
        const computeTimeMs = endTime - startTime;
        
        const computeMinutes = Math.floor(computeTimeMs / (1000 * 60));
        const computeSeconds = Math.floor((computeTimeMs % (1000 * 60)) / 1000);
        
        if (computeMinutes > 0) {
          computeTime = `${computeMinutes}m ${computeSeconds}s`;
        } else {
          computeTime = `${computeSeconds}s`;
        }
      } else {
        computeTime = 'N/A';
      }
      
      return `${d.encoding_name},${d.dataset},${d.ansatz},${d.accuracy},${d.loss ?? ""},${d.depth ? `${d.depth} Qubits` : ""},${computeTime}`;
    }
  );
  const csvContent = header + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "benchmark_results.csv");
  link.click();
  URL.revokeObjectURL(url);
}

const CustomLegend = ({ payload }) => (
  <ul className="flex justify-center gap-4 mt-4">
    {payload.map((entry, index) => (
      <li key={index} className="flex items-center gap-2">
        <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
        <span style={{ color: "#000000", fontSize: "14px", fontWeight: 500 }}>{entry.value}</span>
      </li>
    ))}
  </ul>
);

const EvaluationResult = ({ onShowTutorial }) => {
  const [data, setData] = useState([]);
  const [runIds, setRunIds] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("all");
  const [selectedAnsatz, setSelectedAnsatz] = useState("all");
  const [viewMode, setViewMode] = useState("chart");
  const [selectedMetric, setSelectedMetric] = useState("accuracy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [useLast, setUseLast] = useState(false);
  const [qubitCountFilter, setQubitCountFilter] = useState("all");
  const [showQubitWarning, setShowQubitWarning] = useState(false);

  // Beim Seitenstart die aktuellen IDs laden
  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem('benchmarkRunIds') || '[]');
    setRunIds(ids);
  }, []);

  // runIds ändern sich basierend auf useLast beim Umschalten der Buttons
  useEffect(() => {
    const ids = useLast
      ? JSON.parse(localStorage.getItem('lastBenchmarkRunIds') || '[]')
      : JSON.parse(localStorage.getItem('benchmarkRunIds') || '[]');
    setRunIds(ids);
  }, [useLast]);

  // Nur abhängig von runIds
  useEffect(() => {
    if (!runIds.length) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDetailedResults(runIds)
      .then(setData)
      .catch(err => setError(err.message || '获取结果失败'))
      .finally(() => setLoading(false));
  }, [runIds]);

      // Polling-Logik abhängig von runIds und isPolling
  useEffect(() => {
    if (!isPolling) return;
    let pollTimer;
    const pollData = async () => {
      let allDone = true;
      for (const runId of runIds) {
        try {
          const status = await runAPI.getRunById(runId);
          if (status.status !== 'done') {
            allDone = false;
            break;
          }
        } catch (_) { continue; }
      }
      if (allDone) setIsPolling(false);
      fetchDetailedResults(runIds)
        .then(setData)
        .catch(err => setError(err.message || '获取结果失败'));
    };
    pollData();
    pollTimer = setInterval(pollData, 5000);
    return () => clearInterval(pollTimer);
  }, [isPolling, runIds]);

      // Detaillierte Ergebnisdaten abrufen (aus der benchmarkResults-Sammlung)
  const fetchDetailedResults = async (runIds) => {
    const detailedResults = [];
    for (const runId of runIds) {
      try {
        const detailedResult = await resultAPI.getResultById(runId);
        if (detailedResult && (detailedResult.loss !== undefined || detailedResult.accuracy !== undefined)) {
          const runStatus = await runAPI.getRunById(runId);
          const resourceResponse = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encoding_ids: [String(runStatus.encoding_id)],
              ansatz_ids: [String(runStatus.ansatz_id)],
              dataset_ids: [String(runStatus.data_id)],
              full: true
            })
          });
          if (resourceResponse.ok) {
            const resources = await resourceResponse.json();
            detailedResults.push({
              id: `${runStatus.encoding_id}-${runStatus.data_id}-${runStatus.ansatz_id}`,
              run_id: runId,
              encoding_name: resources.encodings[runStatus.encoding_id]?.name || `Encoding ${runStatus.encoding_id}`,
              dataset: resources.datasets[runStatus.data_id]?.name || `Dataset ${runStatus.data_id}`,
              ansatz: resources.ansaetze[runStatus.ansatz_id]?.name || `Ansatz ${runStatus.ansatz_id}`,
              accuracy: detailedResult.accuracy ?? null,
              loss: detailedResult.loss ?? null,
              depth: runStatus.qubit_count ?? null,
              is_user: runStatus.encoding_id === 0,
              timestamp: runStatus.timestamp,
              status: runStatus.status,
              progress: runStatus.progress || 0
            });
          }
        }
      } catch (err) {
        // 404 direkt überspringen
        if (err.message && err.message.includes('404')) {
          continue;
        }
        // Andere Fehler auch überspringen
        console.warn(`获取run_id ${runId}的详细结果失败:`, err);
      }
    }
    return detailedResults;
  };

      // Refresh-Button-Klick behandeln
  const handleRefresh = useCallback(async () => {
          // Alle Zustände zurücksetzen
    setLoading(true);
    setError(null);
    setData([]);
    setIsPolling(false);
    
    try {
      const storedIds = localStorage.getItem('benchmarkRunIds');
      
      if (storedIds) {
        // Wenn von Benchmark weitergeleitet, Polling neu starten
        const ids = JSON.parse(storedIds);
        setRunIds(ids);
        setIsPolling(true);
      } else {
        // Bei normalem Besuch alle Daten neu abrufen
        const response = await fetch('/api/run');
        if (!response.ok) {
          throw new Error('获取运行记录失败');
        }
        const allRuns = await response.json();
        
        // Abgeschlossene Läufe filtern und nach Zeitstempel sortieren
        const completedRuns = allRuns
          .filter(run => run.status === 'done')
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
        const completedRunIds = completedRuns.map(run => run.id);
        setRunIds(completedRunIds);
        
        // Detaillierte Ergebnisse abrufen
        if (completedRunIds.length > 0) {
          const detailedResults = await fetchDetailedResults(completedRunIds);
          setData(detailedResults);
        }
      }
    } catch (err) {
      console.error('刷新数据时出错:', err);
      setError(err.message || '刷新数据时出错');
      setIsPolling(false);
    } finally {
      setLoading(false);
    }
  }, []);

        // Dropdown-Optionen generieren, sicherstellen dass sie mit data-Feldern übereinstimmen
  const datasets = Array.from(new Set(data.map((d) => d.dataset)));
  const ansatzes = Array.from(new Set(data.map((d) => d.ansatz)));
  const qubitCounts = Array.from(new Set(data.map((d) => d.depth).filter(d => d !== null))).sort((a, b) => a - b);

      // Qubit-Anzahl-Übereinstimmung prüfen
  const qubitCountMismatch = React.useMemo(() => {
    if (qubitCounts.length <= 1) return false;
    
    const filteredByDataset = selectedDataset !== "all" ? 
      data.filter(d => d.dataset === selectedDataset) : data;
    const filteredByAnsatz = selectedAnsatz !== "all" ? 
      filteredByDataset.filter(d => d.ansatz === selectedAnsatz) : filteredByDataset;
    
    const depths = filteredByAnsatz.map(d => d.depth).filter(d => d !== null);
    return depths.length > 1 && new Set(depths).size > 1;
  }, [data, selectedDataset, selectedAnsatz, qubitCounts]);

      // Qubit-Anzahl-Warnungsstatus aktualisieren
  React.useEffect(() => {
    setShowQubitWarning(qubitCountMismatch);
  }, [qubitCountMismatch]);

  const filteredData = data.filter(
    (entry) =>
      (selectedDataset === "all" || entry.dataset === selectedDataset) &&
      (selectedAnsatz === "all" || entry.ansatz === selectedAnsatz) &&
      (qubitCountFilter === "all" || entry.depth === parseInt(qubitCountFilter))
  );

      // Chart-Titel abrufen
  const getMetricTitle = () => {
    switch (selectedMetric) {
      case "accuracy":
        return "Genauigkeitsvergleich";
      case "loss":
        return "Verlustvergleich";
      case "depth":
        return "Qubit-Anzahl Vergleich";
      default:
        return "Datenvergleich";
    }
  };

      // Chart-Daten abrufen
  const getChartData = useCallback((sourceData) => {
    if (!sourceData.length) return [];
          // Entsprechende Daten basierend auf der ausgewählten Metrik zurückgeben
    const chartData = sourceData.map(item => ({
      ...item,
      [selectedMetric]: selectedMetric === 'accuracy' ? 
        (item.accuracy !== null ? item.accuracy * 100 : null) : 
        selectedMetric === 'loss' ? 
          item.loss : 
          item.depth
    }));
    return chartData;
  }, [selectedMetric]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading benchmark results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

      // Qubit-Anzahl-Warnungskomponente
  const QubitCountWarning = () => {
    if (!showQubitWarning) return null;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Vergleichsergebnisse mit unterschiedlichen Qubit-Anzahlen
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Die ausgewählten Ergebnisse wurden mit unterschiedlichen Qubit-Anzahlen berechnet. 
                Dies kann die Vergleichbarkeit der Ergebnisse beeinträchtigen.
              </p>
              <p className="mt-1">
                <strong>Empfehlung:</strong> Verwenden Sie den Qubit-Filter, um nur Ergebnisse mit 
                der gleichen Qubit-Anzahl zu vergleichen.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

      // Ergebnisstatistik-Komponente hinzufügen
  const ResultsSummary = ({ data }) => {
    const stats = React.useMemo(() => {
      if (!data.length) return {
        totalResults: 0,
        avgAccuracy: 'N/A',
        avgLoss: 'N/A',
        datasets: 0,
        qubitInfo: 'N/A'
      };

      const accuracies = data.map(r => r.accuracy).filter(a => a != null);
      const losses = data.map(r => r.loss).filter(l => l != null);
      const uniqueDatasets = new Set(data.map(r => r.dataset));
      const qubitCounts = data.map(r => r.depth).filter(d => d !== null);
      
      let qubitInfo = 'N/A';
      if (qubitCounts.length > 0) {
        const uniqueQubits = [...new Set(qubitCounts)].sort((a, b) => a - b);
        if (uniqueQubits.length === 1) {
          qubitInfo = `${uniqueQubits[0]} Qubits`;
        } else {
          qubitInfo = `${uniqueQubits.length} verschiedene (${uniqueQubits.join(', ')})`;
        }
      }

      return {
        totalResults: data.length,
        avgAccuracy: accuracies.length ?
          `${(accuracies.reduce((a, b) => a + b, 0) / accuracies.length * 100).toFixed(1)}%` :
          'N/A',
        avgLoss: losses.length ?
          `${(losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(3)}` :
          'N/A',
        datasets: uniqueDatasets.size,
        qubitInfo: qubitInfo
      };
    }, [data]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-blue-800">Total Results</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalResults}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-green-800">Avg Accuracy</h3>
          <p className="text-2xl font-bold text-green-600">{stats.avgAccuracy}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-purple-800">Avg Loss</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.avgLoss}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-orange-800">Datasets</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.datasets}</p>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg text-center">
          <h3 className="font-semibold text-teal-800">Qubit Info</h3>
          <p className="text-lg font-bold text-teal-600">{stats.qubitInfo}</p>
        </div>
      </div>
    );
  };

      // Fehlermeldungs-Komponente hinzufügen
  const ErrorMessage = () => {
    if (!error) return null;

    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">错误！</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  };

      // Kartenbasierte Anzeige-Komponente hinzufügen
  const ResultCards = ({ data }) => {
    if (!data.length) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {data.map((run, index) => (
          <div key={`${run.id}-${index}`} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Lauf ID: {run.run_id}</h3>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {run.status || 'Abgeschlossen'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Kodierung:</span>
                <span className="font-medium text-gray-800">{run.encoding_name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Datensatz:</span>
                <span className="font-medium text-gray-800">{run.dataset}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Ansatz:</span>
                <span className="font-medium text-gray-800">{run.ansatz}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Qubits:</span>
                <span className="font-medium text-gray-800">
                  {run.depth ? `${run.depth} Qubits` : 'N/A'}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Accuracy</div>
                  <div className="text-lg font-bold text-blue-600">
                    {run.accuracy !== null ? `${(run.accuracy * 100).toFixed(2)}%` : 'N/A'}
                  </div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-sm text-gray-600">Loss</div>
                  <div className="text-lg font-bold text-purple-600">
                    {run.loss?.toFixed(4) || 'N/A'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Qubits</div>
                  <div className="text-lg font-bold text-green-600">
                    {run.depth ? `${run.depth} Qubits` : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mt-4">
                {(() => {
                  // Benchmark-Startzeit abrufen
                  const benchmarkStartTime = localStorage.getItem('benchmarkStartTime');
                  const timestamp = new Date(run.timestamp);
                  
                  if (benchmarkStartTime && run.status === 'done') {
                    // Tatsächliche Berechnungszeit berechnen
                    const startTime = parseInt(benchmarkStartTime);
                    const endTime = timestamp.getTime();
                    const computeTimeMs = endTime - startTime;
                    
                    const computeMinutes = Math.floor(computeTimeMs / (1000 * 60));
                    const computeSeconds = Math.floor((computeTimeMs % (1000 * 60)) / 1000);
                    
                    let computeTimeStr = '';
                    if (computeMinutes > 0) {
                      computeTimeStr = `${computeMinutes}m ${computeSeconds}s`;
                    } else {
                      computeTimeStr = `${computeSeconds}s`;
                    }
                    
                    return `Berechnungszeit: ${computeTimeStr}`;
                  } else {
                    // Relative Zeit anzeigen
                    const now = new Date();
                    const diffMs = now - timestamp;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    
                    let timeAgo = '';
                    if (diffDays > 0) {
                      timeAgo = `${diffDays} Tag${diffDays > 1 ? 'e' : ''} her`;
                    } else if (diffHours > 0) {
                      timeAgo = `${diffHours} Stunde${diffHours > 1 ? 'n' : ''} her`;
                    } else if (diffMinutes > 0) {
                      timeAgo = `${diffMinutes} Minute${diffMinutes > 1 ? 'n' : ''} her`;
                    } else {
                      timeAgo = 'Gerade eben';
                    }
                    
                    return `Erstellt: ${timeAgo}`;
                  }
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full bg-white rounded-xl shadow-md border border-gray-300 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            Quantum Encoding Benchmark
          </h1>
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

        {/* 添加错误提示显示 */}
        <ErrorMessage />

        {/* 使用新的结果统计组件 */}
        <ResultsSummary data={data} />
        
        {/* 量子比特数量警告 */}
        <QubitCountWarning />
        
        {/* 过滤器状态指示器 */}
        {data.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            {filteredData.length === data.length ? (
              <span>Alle {data.length} Ergebnisse werden angezeigt</span>
            ) : (
              <span>
                {filteredData.length} von {data.length} Ergebnissen werden angezeigt
                {qubitCountFilter !== "all" && (
                  <span className="ml-2 text-blue-600">
                    (gefiltert nach {qubitCountFilter} Qubits)
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Filters and export */}
        <div className="flex flex-wrap justify-center gap-4 text-black">
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Alle Datensätze</option>
            {datasets.map((ds) => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>

          <select
            value={selectedAnsatz}
            onChange={(e) => setSelectedAnsatz(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Alle Ansätze</option>
            {ansatzes.map((ans) => (
              <option key={ans} value={ans}>{ans}</option>
            ))}
          </select>

          <select
            value={qubitCountFilter}
            onChange={(e) => setQubitCountFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Alle Qubit-Anzahlen</option>
            {qubitCounts.map((count) => (
              <option key={count} value={count}>{count} Qubits</option>
            ))}
          </select>
          
          {/* 快速过滤按钮 */}
          {qubitCounts.length > 1 && (
            <div className="flex gap-2">
              {qubitCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => setQubitCountFilter(count.toString())}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    qubitCountFilter === count.toString()
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {count} Qubits
                </button>
              ))}
              <button
                onClick={() => setQubitCountFilter("all")}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  qubitCountFilter === "all"
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Alle
              </button>
            </div>
          )}

          <button
            onClick={() => exportToCSV(filteredData)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            CSV Exportieren
          </button>

          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Laden...' : 'Aktualisieren'}
          </button>
          
          {/* 清除所有过滤器按钮 */}
          {(selectedDataset !== "all" || selectedAnsatz !== "all" || qubitCountFilter !== "all") && (
            <button
              onClick={() => {
                setSelectedDataset("all");
                setSelectedAnsatz("all");
                setQubitCountFilter("all");
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Filter löschen
            </button>
          )}

          <button
            onClick={() => setUseLast(v => !v)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {useLast ? 'Show Current Results' : 'Show Previous Results'}
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap justify-center gap-4">
          {["chart", "table"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all ${viewMode === mode
                ? "bg-black text-white"
                : "bg-white text-black border-black hover:bg-gray-100"
                }`}
            >
              {mode === "chart" ? "Diagramme" : "Tabelle"}
            </button>
          ))}
        </div>

        {/* Metric toggle */}
        {viewMode !== "table" && (
          <div className="flex flex-wrap justify-center gap-4">
            {["accuracy", "loss", "depth"].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-4 py-2 rounded border text-sm font-medium transition-all ${selectedMetric === metric
                  ? "bg-black text-white"
                  : "bg-white text-black border-black hover:bg-gray-100"
                  }`}
              >
                {metric === 'depth' ? 'Qubits' : metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Results display */}
        {filteredData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No available results. Some tasks may still be running. Please refresh the page later.
            </p>
          </div>
        ) : viewMode === "chart" ? (
          <div className="space-y-8">
            {/* 图表部分 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{getMetricTitle()}</h2>
                {filteredData.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Neuester Lauf ID: {filteredData[0].run_id}
                    {filteredData[0].status !== 'done' && (
                      <span className="ml-2">
                        (Progress: {Math.round(filteredData[0].progress * 100)}%)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getChartData(filteredData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="encoding_name" 
                    tick={{ fontSize: 14, fontWeight: 500 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 14, fontWeight: 500 }}
                    domain={selectedMetric === 'accuracy' ? [0, 100] : ['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: 14, fontWeight: 500 }}
                    formatter={(value) => {
                      if (value === null) return ['N/A'];
                      if (selectedMetric === 'accuracy') {
                        return [`${value.toFixed(2)}%, 'Accuracy'`];
                      } else if (selectedMetric === 'loss') {
                        return [`${value.toFixed(4)}, 'Loss'`];
                      }
                      return [`${value} Qubits, 'Qubits'`];
                    }}
                  />
                  <Legend content={<CustomLegend />} />
                  <Bar
                    dataKey={selectedMetric}
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.is_user ? "#ff7300" : "#8884d8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 卡片展示部分 */}
            <ResultCards data={filteredData} />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-black">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Kodierung</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Datensatz</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Ansatz</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Genauigkeit</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Verlust</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Qubits</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Zeit</th>
                  <th className="border border-gray-300 px-4 py-2 text-black">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((run, index) => (
                  <tr key={`${run.run_id}-${run.id}-${index}`} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-300 px-4 py-2 text-black">{run.run_id}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">{run.encoding_name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">{run.dataset}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">{run.ansatz}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">
                      {run.accuracy !== null ? `${(run.accuracy * 100).toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-black">
                      {run.loss?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-black">
                      {run.depth ? `${run.depth} Qubits` : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-black">
                      {(() => {
                        const benchmarkStartTime = localStorage.getItem('benchmarkStartTime');
                        const timestamp = new Date(run.timestamp);
                        
                        if (benchmarkStartTime && run.status === 'done') {
                          const startTime = parseInt(benchmarkStartTime);
                          const endTime = timestamp.getTime();
                          const computeTimeMs = endTime - startTime;
                          
                          const computeMinutes = Math.floor(computeTimeMs / (1000 * 60));
                          const computeSeconds = Math.floor((computeTimeMs % (1000 * 60)) / 1000);
                          
                          if (computeMinutes > 0) {
                            return `${computeMinutes}m ${computeSeconds}s`;
                          } else {
                            return `${computeSeconds}s`;
                          }
                        } else {
                          return 'N/A';
                        }
                      })()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-black">{run.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationResult;