// API service layer for backend communication
const API_BASE_URL = '/api'; // Relative Pfade verwenden, Vite-Proxy behandeln

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  // Prüfen ob URL bereits Zeitstempel-Parameter enthält
  const hasTimestamp = endpoint.includes('t=');
  if (!hasTimestamp) {
    // Nur hinzufügen wenn kein Zeitstempel vorhanden
    const timeStamp = Date.now();
    const separator = endpoint.includes('?') ? '&' : '?';
    endpoint = `${endpoint}${separator}t=${timeStamp}`;
  }

  console.log(`Making API call to ${endpoint}`, options);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Cache-Control-Header hinzufügen
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers
      },
      ...options
    });

    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} from ${endpoint}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Data from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
};

// Encoding API
export const encodingAPI = {
  // Validate and store quantum circuit encoding
  validateCircuit: (circuit) => apiCall('/encoding/', {
    method: 'POST',
    body: JSON.stringify(circuit)
  }),

  // Get all encodings
  getAllEncodings: () => apiCall('/encoding/'),

  // Get encoding by ID
  getEncodingById: (id) => apiCall(`/encoding/${id}/`),

  // Update encoding
  updateEncoding: (id, circuit) => apiCall(`/encoding/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(circuit)
  }),

  // Delete encoding
  deleteEncoding: (id) => apiCall(`/encoding/${id}/`, {
    method: 'DELETE'
  })
};

// Dataset API
export const datasetAPI = {
  // Create reference data
  createReferenceData: (data) => apiCall('/dataset', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Get all datasets
  getAllDatasets: () => apiCall('/dataset'),

  // Get dataset by ID
  getDatasetById: (id) => apiCall(`/dataset/${id}`),

  // Update dataset
  updateDataset: (id, data) => apiCall(`/dataset/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Delete dataset
  deleteDataset: (id) => apiCall(`/dataset/${id}`, {
    method: 'DELETE'
  })
};

// Run API
export const runAPI = {
  // Start benchmark run
  startBenchmark: (request) => apiCall('/run', {
    method: 'POST',
    body: JSON.stringify(request)
  }),

  // Get all benchmark runs
  getAllRuns: () => apiCall('/run'),

  // Get run by ID
  getRunById: (id) => apiCall(`/run/${id}`),

  // Update run
  updateRun: (id, request) => apiCall(`/run/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  }),

  // Delete run
  deleteRun: (id) => apiCall(`/run/${id}`, {
    method: 'DELETE'
  })
};

// Result API
export const resultAPI = {
  // Create benchmark result
  createResult: (result) => apiCall('/result', {
    method: 'POST',
    body: JSON.stringify(result)
  }),

  // Alle Ergebnisse abrufen
  getAllResults: async (run_ids = []) => {
    try {
      const params = new URLSearchParams();
      if (run_ids.length > 0) {
        run_ids.forEach(id => params.append('run_ids', id));
      }
      const response = await fetch(`${API_BASE_URL}/result${params.toString() ? '?' + params.toString() : ''}`);
      const data = await response.json();
      console.log(`Data from /result:`, data);
      return data;
    } catch (error) {
      console.error('获取结果失败:', error);
      throw new Error(error.response?.data?.detail || '获取结果失败');
    }
  },

  // Get result by ID
  getResultById: (id) => apiCall(`/result/${id}`),

  // Update result
  updateResult: (id, result) => apiCall(`/result/${id}`, {
    method: 'PUT',
    body: JSON.stringify(result)
  }),

  // Delete result
  deleteResult: (id) => apiCall(`/result/${id}`, {
    method: 'DELETE'
  })
};

// Resources API
export const resourcesAPI = {
  // Fetch multiple resources (encodings, ansaetze, datasets)
  fetchResources: (request) => apiCall('/resources', {
    method: 'POST',
    body: JSON.stringify(request)
  })
};

// Combined API for convenience
export const api = {
  encoding: encodingAPI,
  dataset: datasetAPI,
  run: runAPI,
  result: resultAPI,
  resources: resourcesAPI
};

export default api; 