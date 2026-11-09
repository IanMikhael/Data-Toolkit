import { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, Wand2, Download, Database, Play, TerminalSquare } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State Cleaning
  const [isCleaning, setIsCleaning] = useState(false);
  const [renameTarget, setRenameTarget] = useState('');
  const [newName, setNewName] = useState('');
  const [dtypeCol, setDtypeCol] = useState('');
  const [dtypeTarget, setDtypeTarget] = useState('str');
  const [filterCol, setFilterCol] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [headerRow, setHeaderRow] = useState('');

  // State SQL Workspace
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM data LIMIT 10;");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSqlResult(null); 
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/api/datasets/import', formData);
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan saat mengunggah file.');
    } finally {
      setLoading(false);
    }
  };

  const applyCleaning = async (action: string, params: any = null) => {
    if (!result?.file_path) return;
    setIsCleaning(true);
    setError(null);
    try {
      const payload = { file_path: result.file_path, operations: [{ action, params }] };
      const response = await axios.post('/api/cleaning/', payload);
      setResult({ ...result, ...response.data.data });
      
      if (action === 'rename_columns') { setRenameTarget(''); setNewName(''); }
      if (action === 'filter') { setFilterCol(''); setFilterVal(''); }
      if (action === 'set_header') { setHeaderRow(''); }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal melakukan cleaning');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleExport = () => {
    if (!result?.file_path) return;
    window.open(`http://localhost:8000/api/datasets/download?file_path=${encodeURIComponent(result.file_path)}&filename=${encodeURIComponent(result.filename)}`, '_blank');
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-10 text-white shadow-lg">
        <h2 className="text-4xl font-bold mb-4">Your All-in-One<br/>Data Science Toolkit</h2>
        <p className="text-blue-100 text-lg max-w-xl">
          Work faster with powerful tools for data analysis, visualization, and automation right on your local machine.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <UploadCloud className="text-blue-600" /> Import Dataset
        </h3>
        <div className="flex gap-4 items-center">
          <input 
            type="file" accept=".csv, .xlsx, .xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload} disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Proses Data'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
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

          {/* PANEL DATA CLEANING (LENGKAP DIKEMBALIKAN) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wand2 className="text-purple-600" /> Data Cleaning Tools
              </h3>
              <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                <Download size={16} /> Export Hasil Cleaning
              </button>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => applyCleaning('drop_duplicates')} disabled={isCleaning || result.duplicate_count === 0} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Hapus Baris Duplikat</button>
              <button onClick={() => applyCleaning('drop_nulls')} disabled={isCleaning || Object.values(result.null_counts).every((val: any) => val === 0)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Hapus Baris Kosong (Null)</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-600 uppercase block mb-2">Jadikan Baris sbg Header</span>
                <div className="flex gap-2">
                  <input type="number" min="1" placeholder="Baris ke-" value={headerRow} onChange={(e) => setHeaderRow(e.target.value)} className="flex-1 bg-white border border-blue-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
                  <button onClick={() => applyCleaning('set_header', { index: parseInt(headerRow) - 1 })} disabled={isCleaning || !headerRow} className="bg-blue-600 text-white px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Terapkan</button>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Ubah Nama Kolom</span>
                <div className="flex gap-2">
                  <select value={renameTarget} onChange={(e) => setRenameTarget(e.target.value)} className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="">-- Pilih --</option>
                    {Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <input type="text" placeholder="Nama..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-20 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
                  <button onClick={() => applyCleaning('rename_columns', { [renameTarget]: newName })} disabled={isCleaning || !renameTarget || !newName} className="bg-blue-100 text-blue-700 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50">Ubah</button>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Ubah Tipe Data</span>
                <div className="flex gap-2">
                  <select value={dtypeCol} onChange={(e) => setDtypeCol(e.target.value)} className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="">-- Pilih --</option>
                    {Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <select value={dtypeTarget} onChange={(e) => setDtypeTarget(e.target.value)} className="w-20 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="str">Teks</option>
                    <option value="int">Int</option>
                    <option value="float">Desimal</option>
                  </select>
                  <button onClick={() => applyCleaning('change_dtype', { column: dtypeCol, type: dtypeTarget })} disabled={isCleaning || !dtypeCol} className="bg-blue-100 text-blue-700 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50">Ubah</button>
                </div>
              </div>
              
              {/* FILTER & SORT KEMBALI */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Filter Data</span>
                <div className="flex gap-2">
                  <select value={filterCol} onChange={(e) => setFilterCol(e.target.value)} className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="">-- Pilih --</option>
                    {Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <input type="text" placeholder="Cari..." value={filterVal} onChange={(e) => setFilterVal(e.target.value)} className="w-20 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500" />
                  <button onClick={() => applyCleaning('filter', { column: filterCol, value: filterVal })} disabled={isCleaning || !filterCol || !filterVal} className="bg-blue-100 text-blue-700 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50">Filter</button>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 lg:col-span-2">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Urutkan Data</span>
                <div className="flex gap-2">
                  <select value={sortCol} onChange={(e) => setSortCol(e.target.value)} className="flex-1 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="">-- Pilih Kolom --</option>
                    {Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                  <select value={sortDesc ? 'true' : 'false'} onChange={(e) => setSortDesc(e.target.value === 'true')} className="w-32 bg-white border border-slate-200 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-blue-500">
                    <option value="false">A-Z / Naik</option>
                    <option value="true">Z-A / Turun</option>
                  </select>
                  <button onClick={() => applyCleaning('sort', { column: sortCol, descending: sortDesc })} disabled={isCleaning || !sortCol} className="bg-blue-100 text-blue-700 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 disabled:opacity-50">Sort</button>
                </div>
              </div>
            </div>
          </div>

          {/* TAHAP 3: SQL WORKSPACE */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                <Database className="text-blue-500" /> SQL Workspace
              </h3>
              {sqlResult && (
                <button onClick={handleExportSql} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                  <Download size={16} /> Export Hasil Query
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-lg p-1 border border-slate-800">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 text-slate-400 text-xs font-mono">
                  <TerminalSquare size={14} /> editor.sql — Dataset Anda direpresentasikan sebagai tabel bernama: <strong className="text-blue-400 font-bold">data</strong>
                </div>
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full bg-transparent text-blue-300 font-mono text-sm p-4 outline-none resize-y min-h-[120px]"
                  placeholder="Ketik query SQL di sini... Contoh: SELECT * FROM data WHERE status = 'Lunas'"
                  spellCheck="false"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={handleExecuteSql} disabled={isExecuting || !sqlQuery}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isExecuting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Jalankan Query
                </button>
                {sqlError && <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{sqlError}</p>}
              </div>
            </div>

            {/* PREVIEW HASIL SQL */}
            {sqlResult && (
              <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">Menampilkan hasil: {sqlResult.rows} baris</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 font-medium border-b border-slate-700">
                      <tr>
                        {Object.entries(sqlResult.dtypes).map(([col, type]: any) => (
                          <th key={col} className="px-4 py-3 min-w-[120px]">
                            <div className="flex flex-col gap-1">
                              <span>{col}</span>
                              <span className="text-[10px] text-blue-400 font-mono">{type}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.preview.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          {Object.keys(sqlResult.dtypes).map((col) => (
                            <td key={col} className="px-4 py-3">{row[col] !== null ? String(row[col]) : <span className="text-slate-500 italic">null</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW DATA ASLI (Live Preview) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" /> Live Data Preview
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
                            {result.null_counts[col] > 0 && <span className="text-red-500 bg-red-50 px-1 rounded flex items-center gap-1">{result.null_counts[col]} null</span>}
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
