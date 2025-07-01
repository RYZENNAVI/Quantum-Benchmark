// pages/UploadPage.js
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

//type BenchmarkResult = {
//  encoding_name: string;
//  dataset: string;
//  ansatz: string;
//  accuracy: number;
//  loss: number;
//  depth: number;
//};

//type Gate = {
//  gate: string;
//  wires: number[];
//  params?: (string | number)[];
//};

const CustomLegend = ({ payload }) => (
  <ul className="flex justify-center gap-4 mt-4">
    {payload.map((entry, index) => (
      <li key={index} className="flex items-center gap-2">
        <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
        <span style={{ color: "#000000", fontWeight: 500 }}>{entry.value}</span>
      </li>
    ))}
  </ul>
);

// CSV export function
function exportToCSV(data) {
  const header = "Encoding,Dataset,Ansatz,Accuracy,Loss,Depth\n";
  const rows = data.map(
    (d) =>
      `${d.encoding_name},${d.dataset},${d.ansatz},${d.accuracy},${d.loss ?? ""},${d.depth ?? ""}`
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

const EvaluationResult = () => {
  const [data, setData] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("all");
  const [selectedAnsatz, setSelectedAnsatz] = useState("all");
  const [viewMode, setViewMode] = useState("chart");
  const [selectedMetric, setSelectedMetric] = useState("accuracy");

  {/*useEffect(() => {
    fetch("/mockResults.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Fehler beim Laden:", err));
  }, []); */}

  useEffect(() => {
    fetch("/mockResults.json") // your backend endpoint
    .then((res) => res.json())
    .then((json) => {
      const { results, encodings, ansaetze } = json;

      const processed = results.map((r) => {
        const encoding = encodings[r.encoding_id] || {};
        const ansatz = ansaetze[r.ansatz_id] || {};

        return {
          encoding_name: encoding.name || `Encoding ${r.encoding_id}`,
          dataset: `Dataset ${r.data_id}`, // extend here if you want to map to real names
          ansatz: ansatz.name || `Ansatz ${r.ansatz_id}`,
          accuracy: r.accuracy != null ? r.accuracy / 100 : null,
          loss: r.loss != null ? r.loss / 100 : null,
          depth: encoding.depth ?? null,
          is_user: r.encoding_id === 0 // if our code
        };
      });

      setData(processed);
    })
    .catch((err) => console.error("Fehler beim Laden:", err));
    }, []);


  const datasets = Array.from(new Set(data.map((d) => d.dataset)));
  const ansatzes = Array.from(new Set(data.map((d) => d.ansatz)));

  const filteredData = data.filter(
    (entry) =>
      (selectedDataset === "all" || entry.dataset === selectedDataset) &&
      (selectedAnsatz === "all" || entry.ansatz === selectedAnsatz)
  );

  const getMetricTitle = () => {
    switch (selectedMetric) {
      case "accuracy":
        return "Accuracy Vergleich";
      case "loss":
        return "Loss Vergleich";
      case "depth":
        return "Circuit Depth Vergleich";
      default:
        return "";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="w-full bg-white rounded-xl shadow-md border border-gray-300 p-6 space-y-6">

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Quantum Encoding Benchmark
        </h1>

        {/* Filters & export */}
        <div className="flex flex-wrap justify-center gap-4 text-black">
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Alle Datasets</option>
            {datasets.map((ds) => (
              <option key={ds}>{ds}</option>
            ))}
          </select>

          <select
            value={selectedAnsatz}
            onChange={(e) => setSelectedAnsatz(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Alle Ansätze</option>
            {ansatzes.map((ans) => (
              <option key={ans}>{ans}</option>
            ))}
          </select>

          <button
            onClick={() => exportToCSV(filteredData)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray"
          >
            Exportieren
          </button>
        </div>

        {/* Chart type and metric switch */}
        <div className="flex flex-wrap justify-center gap-4">
          {["chart", "table"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                viewMode === mode
                  ? "bg-black text-white"
                  : "bg-white text-black border-black hover:bg-gray-100"
              }`}
            >
              {mode === "chart" ? "Diagramme" : "Tabelle"}
            </button>
          ))}
        </div>
        {viewMode !== "table" && (
        <div className="flex flex-wrap justify-center gap-4">
          {["accuracy", "loss", "depth"].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                selectedMetric === metric
                  ? "bg-black text-white"
                  : "bg-white text-black border-black hover:bg-gray-100"
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </div>
        )}
        {viewMode === "chart" ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-inner p-6">
              <h2 className="text-xl mb-4 text-center text-gray-700">
                {getMetricTitle()}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="encoding_name" />
                  <YAxis
                    domain={[0.7, 1]}
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    formatter={(val, name) => [`${(val * 100).toFixed(1)}%`, name]}
                  />
                  <Legend content={<CustomLegend />} />
                  <Bar
                    dataKey={selectedMetric}
                    name={
                    selectedMetric === "accuracy"
                      ? "Accuracy"
                      : selectedMetric === "loss"
                      ? "Loss"
                      : "Depth"
                   }   
                    label={{
                      position: "top",
                      formatter: (val) => `${(val * 100).toFixed(1)}%`,
                      style: { fill: "#374151", fontSize: 12 },
                    }}
                  >
                    {filteredData.map((entry, index) => {
                      const max = Math.max(...filteredData.map((e) => e[selectedMetric]));
                      {/*const isBest = entry[selectedMetric] === max;
                      const isUser = entry.encoding_name === "Ihr Encoding";*/}
                      const isBest = entry[selectedMetric] === max;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.is_user
                              ? "#3b82f6"
                              : isBest
                              ? "#10b981"
                              : "#d1d5db"
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-white border rounded-xl p-4">
              {/* Ihr Encoding */}
              <div className="rounded-xl p-4 border border-gray-300 bg-gray-50">
                <div className="text-gray-500 text-sm mb-1">Ihr Encoding</div>
                <div className="text-3xl font-bold text-blue-600">
                  {(() => {
                    const user = filteredData.find((e) => e.is_user);
                    return user && user[selectedMetric] != null
                      ? `${(user[selectedMetric] * 100).toFixed(1)}%`
                      : "--";
                })()}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {(() => {
                  const user = filteredData.find((e) => e.is_user);
                  const others = filteredData.filter((e) => !e.is_user && e[selectedMetric] != null);
                  if (!user || others.length === 0) return "";
                  const avg =
                    others.reduce((sum, e) => sum + e[selectedMetric], 0) / others.length;
                  const diff = ((user[selectedMetric] - avg) * 100).toFixed(1);
                  const sign = diff > 0 ? "+" : "";
                  return `${sign}${diff}% vs Durchschnitt`;
                 })()}
                </div>
            </div>


              {/* Best Encoding */}
              <div className="rounded-xl p-4 border border-gray-300 bg-gray-50">
                <div className="text-gray-500 text-sm mb-1">Bestes Referenz Encoding</div>
                <div className="text-3xl font-bold text-green-600">
                  {(() => {
                    const max = Math.max(...filteredData.map((e) => e[selectedMetric]));
                    return `${(max * 100).toFixed(1)}%`;
                  })()}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {(() => {
                    const max = Math.max(...filteredData.map((e) => e[selectedMetric]));
                    const best = filteredData.find((e) => e[selectedMetric] === max);
                    return best ? `${best.encoding_name} (${best.dataset})` : "--";
                  })()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <table className="w-full mt-4 border text-left text-sm text-black" >
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Encoding</th>
                <th className="p-2">Dataset</th>
                <th className="p-2">Ansatz</th>
                <th className="p-2 text-right">Accuracy</th>
                <th className="p-2 text-right">Loss</th>
                <th className="p-2 text-right">Depth</th>
                
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-2">{entry.encoding_name}</td>
                  <td className="p-2">{entry.dataset}</td>
                  <td className="p-2">{entry.ansatz}</td>
                  <td className="p-2 text-right">
                    {entry.accuracy != null ? `${(entry.accuracy * 100).toFixed(1)}%` : "–"}
                  </td>
                  <td className="p-2 text-right">
                    {entry.loss != null ? `${(entry.loss * 100).toFixed(1)}%` : "–"}
                  </td>
                  <td className="p-2 text-right">{entry.depth ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EvaluationResult;
