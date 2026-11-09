import { useState } from 'react';
import axios from 'axios';
import { Database, Play, TerminalSquare, Download, AlertCircle } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export default function Analysis() {
  const { result } = useDataStore();
  
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM data LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Jika data belum di-upload di halaman Data Explorer, tampilkan peringatan
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500">
         <AlertCircle size={64} className="mb-4 text-slate-300" />
         <h2 className="text-xl font-bold text-slate-700 mb-2">Belum Ada Dataset</h2>
         <p>Silakan upload dan bersihkan data di menu <b>Data Explorer</b> terlebih dahulu sebelum melakukan analisis SQL.</p>
      </div>
    );
  }

  const handleExecuteSql = async () => {
    if (!result?.file_path || !sqlQuery) return;
    setIsExecuting(true);
    setSqlError(null);
    try {
      const response = await axios.post('/api/sql/execute', {
        file_path: result.file_path,
        query: sqlQuery
      });
      setSqlResult(response.data.data);
    } catch (err: any) {
      setSqlError(err.response?.data?.detail || 'Gagal mengeksekusi query');
      setSqlResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportSql = () => {
    if (!sqlResult?.export_path) return;
    window.open(`http://localhost:8000/api/datasets/download?file_path=${encodeURIComponent(sqlResult.export_path)}&filename=${encodeURIComponent(sqlResult.export_filename)}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-lg border border-slate-800 text-slate-100">
        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-3 text-blue-400">
              <Database className="text-blue-500" size={28} /> SQL Workspace
            </h3>
            <p className="text-slate-400 mt-1">Eksekusi query SQL menggunakan DuckDB terhadap dataset aktif Anda.</p>
          </div>
          {sqlResult && (
            <button onClick={handleExportSql} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
              <Download size={16} /> Export Hasil Query
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="bg-slate-950 rounded-lg p-1 border border-slate-800">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 text-slate-400 text-sm font-mono">
              <TerminalSquare size={16} /> editor.sql — Tabel aktif: <strong className="text-blue-400 font-bold">data</strong> ({result.rows} Baris)
            </div>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full bg-transparent text-blue-300 font-mono p-4 outline-none resize-y min-h-[160px]"
              placeholder="Ketik query SQL di sini... Contoh: SELECT * FROM data WHERE status = 'Lunas'"
              spellCheck="false"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button onClick={handleExecuteSql} disabled={isExecuting || !sqlQuery} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2">
              {isExecuting ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Jalankan Query
            </button>
            {sqlError && <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{sqlError}</p>}
          </div>
        </div>

        {sqlResult && (
          <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-inner">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-400">Menampilkan preview: {sqlResult.rows} baris</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-700">
                  <tr>{Object.entries(sqlResult.dtypes).map(([col, type]: any) => (<th key={col} className="px-4 py-3 min-w-[120px]"><div className="flex flex-col gap-1"><span>{col}</span><span className="text-[10px] text-blue-400 font-mono">{type}</span></div></th>))}</tr>
                </thead>
                <tbody>{sqlResult.preview.map((row: any, i: number) => (<tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">{Object.keys(sqlResult.dtypes).map((col) => (<td key={col} className="px-4 py-3">{row[col] !== null ? String(row[col]) : <span className="text-slate-500 italic">null</span>}</td>))}</tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
