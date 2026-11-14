import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Database, Play, AlertCircle, FileCode2, Download, CheckCircle2, Save, Plus, Clock, Trash2, Edit2, X } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export default function Analysis() {
  const { result } = useDataStore();
  
  // Script Manager States
  const [scripts, setScripts] = useState<any[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<number | null>(null);
  const [activeScriptTitle, setActiveScriptTitle] = useState('untitled.sql');
  const [activeLogs, setActiveLogs] = useState<any[] | null>(null);

  // Editor States
  const [query, setQuery] = useState(result ? 'SELECT * FROM dataset LIMIT 10;' : 'SELECT 1 AS test_column;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchScripts = async () => {
    try {
      const res = await axios.get('/api/sql/scripts');
      setScripts(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchScripts(); }, []);

  // Mode Buat Baru
  const handleNewScript = () => {
    setActiveScriptId(null);
    setActiveScriptTitle('untitled.sql');
    setQuery('-- Tulis query baru Anda di sini...');
    setQueryResult(null);
  };

  // Simpan Script (Baru atau Update)
  const handleSaveScript = async () => {
    try {
      if (activeScriptId) {
        // Update script yang sudah ada
        await axios.put(`/api/sql/scripts/${activeScriptId}`, { title: activeScriptTitle, query_text: query });
      } else {
        // Simpan script baru
        const title = prompt("Masukkan nama untuk script ini:", "Laporan_Baru.sql");
        if (!title) return;
        const res = await axios.post('/api/sql/scripts', { title, query_text: query });
        setActiveScriptId(res.data.data.id);
        setActiveScriptTitle(title);
      }
      fetchScripts();
      alert("Script berhasil disimpan!");
    } catch (err) { alert("Gagal menyimpan script."); }
  };

  // Muat Script ke Editor
  const handleLoadScript = (script: any) => {
    setActiveScriptId(script.id);
    setActiveScriptTitle(script.title);
    setQuery(script.query_text);
    setQueryResult(null);
  };

  // Hapus & Rename
  const handleDeleteScript = async (id: number) => {
    if(!confirm("Yakin ingin menghapus script ini?")) return;
    try {
      await axios.delete(`/api/sql/scripts/${id}`);
      if (activeScriptId === id) handleNewScript();
      fetchScripts();
    } catch (err) { alert("Gagal menghapus."); }
  };

  const handleRenameScript = async (id: number, oldName: string) => {
    const newName = prompt("Nama baru script:", oldName);
    if (!newName || newName === oldName) return;
    try {
      await axios.put(`/api/sql/scripts/${id}`, { title: newName });
      if (activeScriptId === id) setActiveScriptTitle(newName);
      fetchScripts();
    } catch (err) { alert("Gagal mengubah nama."); }
  };

  const handleRunQuery = async () => {
    setLoading(true); setError(null);
    try {
      const response = await axios.post('/api/sql/', {
        file_path: result?.file_path || null,
        query: query
      });
      setQueryResult(response.data.data);
      
      // Jika script ini sudah tersimpan, log aktivitas eksekusinya!
      if (activeScriptId) {
        await axios.post(`/api/sql/scripts/${activeScriptId}/log?action=EXECUTE&details=Query dieksekusi dengan hasil ${response.data.data.rows} baris.`);
        fetchScripts(); // Refresh logs
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan pada Query Anda');
      setQueryResult(null);
      if (activeScriptId) {
        await axios.post(`/api/sql/scripts/${activeScriptId}/log?action=ERROR&details=Eksekusi gagal: ${err.response?.data?.detail}`);
      }
    } finally { setLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setActiveScriptTitle(file.name);
        setActiveScriptId(null); // Anggap sbg script baru belum tersimpan
        setQuery(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Database size={28} /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">SQL Workspace</h2>
          <p className="text-slate-500">
            {result 
              ? <span>Dataset aktif: <b className="text-blue-600">{result.filename}</b> (Tabel: <code className="bg-slate-200 px-1 rounded">dataset</code>)</span> 
              : "Jalankan script SQL murni atau upload file .sql Anda di sini."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KOLOM KIRI: Script Manager (DMS Mini) */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-4 h-max flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><FileCode2 size={16} className="text-blue-500"/> Saved Scripts</h3>
            <button onClick={handleNewScript} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg tooltip" title="Buat Script Baru"><Plus size={18}/></button>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {scripts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">Belum ada script tersimpan.</p>
            ) : (
              scripts.map(s => (
                <div key={s.id} className={`group p-3 rounded-xl border text-sm transition cursor-pointer ${activeScriptId === s.id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                  <div onClick={() => handleLoadScript(s)} className="font-medium text-slate-700 truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
                    <span>{new Date(s.updated_at).toLocaleDateString('id-ID')}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e) => { e.stopPropagation(); setActiveLogs(s.logs); }} className="p-1 hover:text-blue-600 rounded" title="Riwayat Log"><Clock size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleRenameScript(s.id, s.title); }} className="p-1 hover:text-emerald-600 rounded"><Edit2 size={14}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteScript(s.id); }} className="p-1 hover:text-red-600 rounded"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KOLOM KANAN: Editor & Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 px-5 py-4 flex justify-between items-center">
              <h3 className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                 <FileCode2 size={18} /> {activeScriptTitle} {activeScriptId ? '' : <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded ml-2">Unsaved</span>}
              </h3>
              <div className="flex gap-2">
                 <input type="file" accept=".sql,.txt" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                 
                 <button onClick={() => fileInputRef.current?.click()} className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-slate-700 tooltip" title="Upload file .sql dari komputer">
                    <Download size={14} className="rotate-180" /> Upload
                 </button>
                 
                 <button onClick={handleSaveScript} className="text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-800 px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1 border border-blue-900/50">
                    <Save size={14} /> Simpan
                 </button>

                 <button onClick={handleRunQuery} disabled={loading || !query.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-lg disabled:opacity-50 ml-2">
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                    Run Query
                 </button>
              </div>
            </div>

            <textarea 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-72 bg-[#0F172A] text-slate-100 p-6 font-mono text-sm outline-none resize-y leading-relaxed"
              spellCheck="false"
            ></textarea>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3 shadow-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="font-mono text-sm whitespace-pre-wrap">{error}</div>
            </div>
          )}

          {queryResult && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                 <CheckCircle2 size={24} className="text-emerald-500" />
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">Hasil Eksekusi</h3>
                   <p className="text-sm text-slate-500 mt-1">{queryResult.rows > 0 ? `Ditemukan ${queryResult.rows} baris` : 'Eksekusi berhasil'}</p>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-y border-slate-200">
                    <tr>{queryResult.columns.map((col: string) => (<th key={col} className="px-5 py-3 whitespace-nowrap">{col}</th>))}</tr>
                  </thead>
                  <tbody>
                    {queryResult.preview.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-blue-50/30 transition">
                        {queryResult.columns.map((col: string) => (
                          <td key={col} className="px-5 py-3 text-slate-700">{row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">null</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Logs/Riwayat Script */}
      {activeLogs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Audit Trail Script SQL</h3>
              <button onClick={() => setActiveLogs(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              {activeLogs.length === 0 ? <p className="text-slate-500 text-center py-8">Belum ada riwayat tercatat.</p> : activeLogs.map((log, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-blue-200 pl-5 relative">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm ${log.action === 'ERROR' ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${log.action === 'ERROR' ? 'text-red-700 bg-red-100' : 'text-blue-700 bg-blue-100'}`}>{log.action}</span>
                    <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">{new Date(log.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
