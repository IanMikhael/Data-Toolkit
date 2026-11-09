import { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/datasets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-10 text-white shadow-lg">
        <h2 className="text-4xl font-bold mb-4">Your All-in-One<br/>Data Science Toolkit</h2>
        <p className="text-blue-100 text-lg max-w-xl">
          Work faster with powerful tools for data analysis, visualization, and automation right on your local machine.
        </p>
      </div>

      {/* Import Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Import Dataset
        </h3>
        
        <div className="flex gap-4 items-center">
          <input 
            type="file" 
            accept=".csv, .xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Proses Data'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {/* Data Profile & Preview */}
      {result && (
        <div className="space-y-6">
          {/* Data Quality Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-slate-500 text-sm font-medium mb-1">Total Dimensi</span>
              <span className="text-2xl font-bold text-slate-800">{result.rows} <span className="text-sm font-normal text-slate-500">Baris</span> × {result.columns} <span className="text-sm font-normal text-slate-500">Kolom</span></span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-slate-500 text-sm font-medium mb-1">Baris Duplikat</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-800">{result.duplicate_count}</span>
                {result.duplicate_count > 0 ? <AlertTriangle size={20} className="text-amber-500" /> : <CheckCircle2 size={20} className="text-green-500" />}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-slate-500 text-sm font-medium mb-1">Total Kolom Kosong (Null)</span>
              <span className="text-2xl font-bold text-slate-800">
                {Object.values(result.null_counts).filter((val: any) => val > 0).length} <span className="text-sm font-normal text-slate-500">kolom butuh cleaning</span>
              </span>
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" /> Preview: {result.filename}
              </h3>
            </div>
            
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    {Object.entries(result.dtypes).map(([col, type]: any) => (
                      <th key={col} className="px-4 py-3 border-b min-w-[120px]">
                        <div className="flex flex-col gap-1">
                          <span>{col}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-500 font-mono bg-blue-50 px-1 rounded">{type}</span>
                            {result.null_counts[col] > 0 && (
                              <span className="text-red-500 bg-red-50 px-1 rounded flex items-center gap-1">
                                {result.null_counts[col]} null
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map((row: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-slate-50">
                      {Object.keys(result.dtypes).map((col) => (
                        <td key={col} className="px-4 py-3">{row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">null</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
