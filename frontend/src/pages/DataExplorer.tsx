import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, Loader2, Wand2, Download, Search, Clock, Trash2, Edit2, FolderOpen, ChevronLeft, X, FileText, CheckCircle2, Replace } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export default function DataExplorer() {
  const { result, setResult } = useDataStore();
  
  const [datasets, setDatasets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [activeLogs, setActiveLogs] = useState<any[] | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  // Find & Replace States
  const [findCol, setFindCol] = useState('');
  const [findVal, setFindVal] = useState('');
  const [replaceVal, setReplaceVal] = useState('');

  // Inline Editing States
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const fetchDatasets = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get('/api/datasets/');
      setDatasets(res.data.data);
    } catch (err) { console.error(err); } 
    finally { setLoadingList(false); }
  };

  useEffect(() => { if (!result) fetchDatasets(); }, [result]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/api/datasets/import', formData);
      setResult(response.data.data);
    } catch (err) { alert("Gagal mengunggah file"); } 
    finally { setUploading(false); }
  };

  const handleOpen = async (id: number) => {
    setLoadingList(true);
    try {
      const res = await axios.get(`/api/datasets/${id}/load`);
      setResult(res.data.data);
    } catch (err) { alert("Gagal membuka dataset"); } 
    finally { setLoadingList(false); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Yakin ingin menghapus dataset ini?")) return;
    try {
      await axios.delete(`/api/datasets/${id}`);
      fetchDatasets();
    } catch (err) { alert("Gagal menghapus dataset"); }
  };

  const handleRenameDataset = async (id: number, oldName: string) => {
    const newName = prompt("Masukkan nama baru:", oldName);
    if (!newName || newName === oldName) return;
    try {
      await axios.put(`/api/datasets/${id}?new_name=${newName}`);
      fetchDatasets();
    } catch (err) { alert("Gagal mengubah nama"); }
  };

  const applyCleaning = async (action: string, params: any = null) => {
    if (!result?.file_path) return;
    setIsCleaning(true);
    try {
      const payload = { file_path: result.file_path, operations: [{ action, params }] };
      const response = await axios.post('/api/cleaning/', payload);
      setResult({ ...result, ...response.data.data });
      await axios.post(`/api/datasets/${result.id}/log?action=CLEANING&details=Melakukan ${action}`);
      
      if (action === 'rename_columns') { setRenameTarget(''); setNewName(''); }
      if (action === 'filter') { setFilterCol(''); setFilterVal(''); }
      if (action === 'set_header') { setHeaderRow(''); }
      if (action === 'find_replace') { setFindCol(''); setFindVal(''); setReplaceVal(''); }
      if (action === 'update_cell') { setEditingCell(null); }
    } catch (err: any) { alert(err.response?.data?.detail || 'Gagal melakukan cleaning'); } 
    finally { setIsCleaning(false); }
  };

  const handleExport = () => {
    if (!result?.file_path) return;
    const url = `http://localhost:8000/api/datasets/download?file_path=${encodeURIComponent(result.file_path)}&filename=${encodeURIComponent(result.filename)}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger saat double-click sel
  const startEditing = (row: number, col: string, val: any) => {
    setEditingCell({ row, col });
    setEditingValue(val !== null ? String(val) : '');
  };

  // Submit edit sel
  const handleUpdateCell = (row: number, col: string) => {
    if (editingCell) {
      applyCleaning('update_cell', { row_index: row, column: col, new_val: editingValue });
    }
  };

  const inputUI = "flex-1 min-w-0 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2.5 outline-none transition-all shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400";
  const btnUI = "shrink-0 bg-blue-600 text-white px-5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm hover:shadow active:scale-95";

  if (result) {
    return (
      <div className="space-y-6 pb-12">
        <button onClick={() => setResult(null)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition mb-4">
          <ChevronLeft size={20} /> Kembali ke File Manager
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileSpreadsheet className="text-blue-600"/> {result.filename}</h3>
            <p className="text-sm text-slate-500 mt-1">Workspace Data Cleaning & Preparation</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
               <div className="text-sm text-slate-500">Total Dimensi</div>
               <div className="font-bold text-lg text-slate-700">{result.rows} Baris × {result.columns} Kolom</div>
             </div>
             <div className="text-right border-l pl-4 border-slate-200">
               <div className="text-sm text-slate-500">Duplikat</div>
               <div className="font-bold text-lg text-amber-500">{result.duplicate_count}</div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><Wand2 className="text-purple-600" /> Cleaning Tools</h3>
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"><Download size={16} /> Export Hasil Cleaning</button>
          </div>
          
          <div className="flex gap-3 mb-2">
            <button onClick={() => applyCleaning('drop_duplicates')} disabled={isCleaning || result.duplicate_count === 0} className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"><Trash2 size={16} className="text-amber-500"/> Hapus Duplikat</button>
            <button onClick={() => applyCleaning('drop_nulls')} disabled={isCleaning} className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"><Trash2 size={16} className="text-red-400"/> Hapus Baris Kosong</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            
            {/* Find & Replace (Bulk) */}
            <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100 flex flex-col justify-between hover:border-amber-200 transition shadow-inner col-span-1 md:col-span-2 xl:col-span-1">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide block mb-3 flex items-center gap-1"><Replace size={14}/> Cari & Ganti (Bulk)</span>
              <div className="flex flex-col gap-2">
                <select value={findCol} onChange={(e) => setFindCol(e.target.value)} className={inputUI}>
                  <option value="">-- Pilih Kolom --</option>{Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" placeholder="Cari teks..." value={findVal} onChange={(e) => setFindVal(e.target.value)} className={`${inputUI} w-1/3`} />
                  <input type="text" placeholder="Ganti jadi..." value={replaceVal} onChange={(e) => setReplaceVal(e.target.value)} className={`${inputUI} w-1/3`} />
                  <button onClick={() => applyCleaning('find_replace', { column: findCol, find_val: findVal, replace_val: replaceVal })} disabled={isCleaning || !findCol || !findVal} className="shrink-0 bg-amber-500 text-white px-4 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition shadow-sm">Ganti</button>
                </div>
              </div>
            </div>

            {/* Jadikan Baris sbg Header */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex flex-col justify-between hover:border-blue-200 transition">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-3">Jadikan Baris sbg Header</span>
              <div className="flex gap-2">
                <input type="number" min="1" placeholder="Nomor baris..." value={headerRow} onChange={(e) => setHeaderRow(e.target.value)} className={inputUI} />
                <button onClick={() => applyCleaning('set_header', { index: parseInt(headerRow) - 1 })} disabled={isCleaning || !headerRow} className={btnUI}>Terapkan</button>
              </div>
            </div>

            {/* Ubah Nama Kolom */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Ubah Nama Kolom</span>
              <div className="flex flex-col gap-2">
                <select value={renameTarget} onChange={(e) => setRenameTarget(e.target.value)} className={inputUI}>
                  <option value="">-- Pilih Kolom Asal --</option>{Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ketik Nama Baru..." value={newName} onChange={(e) => setNewName(e.target.value)} className={inputUI} />
                  <button onClick={() => applyCleaning('rename_columns', { [renameTarget]: newName })} disabled={isCleaning || !renameTarget || !newName} className={btnUI}>Ubah</button>
                </div>
              </div>
            </div>
            
            {/* Ubah Tipe Data */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Ubah Tipe Data</span>
              <div className="flex flex-col gap-2">
                <select value={dtypeCol} onChange={(e) => setDtypeCol(e.target.value)} className={inputUI}>
                  <option value="">-- Pilih Kolom --</option>{Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col} ({result.dtypes[col]})</option>)}
                </select>
                <div className="flex gap-2">
                  <select value={dtypeTarget} onChange={(e) => setDtypeTarget(e.target.value)} className={inputUI}>
                    <option value="str">Teks (String)</option><option value="int">Bilangan Bulat (Int)</option><option value="float">Desimal (Float)</option><option value="date">Tanggal (Date)</option><option value="bool">Benar/Salah (Bool)</option>
                  </select>
                  <button onClick={() => applyCleaning('change_dtype', { column: dtypeCol, type: dtypeTarget })} disabled={isCleaning || !dtypeCol} className={btnUI}>Ubah</button>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Filter Data</span>
              <div className="flex flex-col gap-2">
                <select value={filterCol} onChange={(e) => setFilterCol(e.target.value)} className={inputUI}>
                  <option value="">-- Pilih Kolom --</option>{Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" placeholder="Cari isi data..." value={filterVal} onChange={(e) => setFilterVal(e.target.value)} className={inputUI} />
                  <button onClick={() => applyCleaning('filter', { column: filterCol, value: filterVal })} disabled={isCleaning || !filterCol || !filterVal} className={btnUI}>Filter</button>
                </div>
              </div>
            </div>

            {/* Urutkan */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-3">Urutkan Data</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={sortCol} onChange={(e) => setSortCol(e.target.value)} className={inputUI}>
                  <option value="">-- Pilih Kolom --</option>{Object.keys(result.dtypes).map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <div className="flex gap-2 sm:w-1/2">
                  <select value={sortDesc ? 'true' : 'false'} onChange={(e) => setSortDesc(e.target.value === 'true')} className={inputUI}>
                    <option value="false">A-Z (Menaik)</option><option value="true">Z-A (Menurun)</option>
                  </select>
                  <button onClick={() => applyCleaning('sort', { column: sortCol, descending: sortDesc })} disabled={isCleaning || !sortCol} className={btnUI}>Sort</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">💡 TIPS: Klik ganda (Double-Click) pada sel tabel di bawah untuk mengedit data secara langsung.</span>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>{Object.entries(result.dtypes).map(([col, type]: any) => (<th key={col} className="px-5 py-4 border-b border-slate-200 min-w-[140px] whitespace-nowrap">{col} <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">{type}</span></th>))}</tr>
              </thead>
              <tbody>
                {result.preview.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="border-b border-slate-100 hover:bg-blue-50/20 transition group">
                    {Object.keys(result.dtypes).map((col) => (
                      <td 
                        key={col} 
                        className={`px-5 py-2 text-slate-700 border-x border-transparent group-hover:border-slate-100 transition-colors ${editingCell?.row === rowIndex && editingCell?.col === col ? 'p-1' : 'cursor-text'}`}
                        onDoubleClick={() => startEditing(rowIndex, col, row[col])}
                      >
                        {editingCell?.row === rowIndex && editingCell?.col === col ? (
                          <input 
                            autoFocus
                            type="text" 
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleUpdateCell(rowIndex, col)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCell(rowIndex, col)}
                            className="w-full border-2 border-blue-500 rounded px-2 py-1.5 outline-none shadow-sm text-sm"
                            disabled={isCleaning}
                          />
                        ) : (
                          row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">null</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const filteredDatasets = datasets.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dataset Manager</h2>
          <p className="text-slate-500">Kelola dan telusuri riwayat dataset Anda.</p>
        </div>
      </div>

      <div 
        className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 p-10 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" accept=".csv, .xlsx, .xls, .json, .parquet" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
        {uploading ? <Loader2 size={52} className="text-blue-500 animate-spin mb-4" /> : <UploadCloud size={52} className="text-blue-400 group-hover:text-blue-600 transition-colors mb-4" />}
        <h3 className="text-lg font-bold text-slate-700">Klik atau Drag & Drop file ke sini</h3>
        <p className="text-slate-500 text-sm mt-1">Mendukung .CSV, .XLSX, .JSON, dan .PARQUET</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex gap-4 items-center bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Cari nama dataset..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
          </div>
        </div>
        
        {loadingList ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center"><Loader2 className="animate-spin mb-3 text-blue-500" size={36}/> Memuat...</div>
        ) : filteredDatasets.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center"><FileText size={56} className="mb-4 text-slate-300"/> Belum ada dataset tersimpan.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs tracking-wider">
              <tr><th className="px-6 py-4 font-bold">Nama File</th><th className="px-6 py-4 font-bold">Terakhir Diubah</th><th className="px-6 py-4 font-bold text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {filteredDatasets.map((ds) => (
                <tr key={ds.id} className="border-b border-slate-100 hover:bg-blue-50/30 transition group">
                  <td className="px-6 py-4"><div className="flex items-center gap-3 font-medium text-slate-700"><div className="bg-blue-100 p-2.5 rounded-lg text-blue-600"><FileSpreadsheet size={18}/></div>{ds.filename}</div></td>
                  <td className="px-6 py-4 text-slate-500">{new Date(ds.updated_at).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                      <button onClick={() => setActiveLogs(ds.logs)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg" title="Riwayat"><Clock size={18}/></button>
                      <button onClick={() => handleRenameDataset(ds.id, ds.filename)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg"><Edit2 size={18}/></button>
                      <button onClick={() => handleDelete(ds.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                      <button onClick={() => handleOpen(ds.id)} className="px-5 py-2.5 bg-slate-800 text-white hover:bg-blue-600 rounded-lg font-semibold flex items-center gap-2 ml-2"><FolderOpen size={16}/> Buka</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activeLogs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Audit Trail</h3>
              <button onClick={() => setActiveLogs(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              {activeLogs.length === 0 ? <p className="text-slate-500 text-center py-8">Belum ada riwayat.</p> : activeLogs.map((log, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-blue-200 pl-5 relative">
                  <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1 border-2 border-white shadow-sm"></div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">{log.action}</span>
                    <p className="text-sm text-slate-700 mt-1.5">{log.details}</p>
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
