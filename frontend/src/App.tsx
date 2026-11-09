import { useEffect, useState } from 'react'
import axios from 'axios'

interface HealthResponse {
  status: string;
  message: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<HealthResponse>('/api/health')
      .then(response => {
        setHealth(response.data);
      })
      .catch(err => {
        setError(err.message || 'Gagal terhubung ke backend');
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Data Toolkit Workspace</h1>
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Status Backend:</h3>
        {error ? (
          <p style={{ color: 'red' }}>❌ {error}</p>
        ) : health ? (
          <p style={{ color: 'green' }}>✅ {health.message}</p>
        ) : (
          <p>Memeriksa koneksi...</p>
        )}
      </div>
    </div>
  )
}

export default App
