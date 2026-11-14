import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Server, Database, Key, User, Play, Loader2, AlertCircle, HardDrive } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export default function DatabaseConnector() {
  const { setResult } = useDataStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    db_type: 'postgresql',
    host: 'localhost',
    port: '5432',
    username: 'postgres',
    password: '',
    database: '',
    dataset_name: 'Ekstrak_Data_DB',
    query: 'SELECT * FROM nama_tabel LIMIT 1000'
  });

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/db/import', formData);
      // Simpan hasil ke state global, lalu lempar user ke Data Explorer!
      setResult(response.data.data);
      navigate('/data-explorer');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Koneksi ke Database Gagal');
    } finally {
      setLoading(false);
    }
  };

  const inputUI = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Server size={28} /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Database Connector</h2>
          <p className="text-slate-500">Tarik data langsung dari server PostgreSQL atau MySQL.</p>
        </div>
      </div>

      <form onSubmit={handleImport} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: Kredensial Server */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5 h-max">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <Key size={18} className="text-emerald-500" /> Kredensial Server
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tipe Database</label>
            <select name="db_type" value={formData.db_type} onChange={handleChange} className={inputUI}>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Host / IP</label>
              <input type="text" name="host" value={formData.host} onChange={handleChange} className={inputUI} required />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Port</label>
              <input type="text" name="port" value={formData.port} onChange={handleChange} className={inputUI} required />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nama Database</label>
            <input type="text" name="database" value={formData.database} onChange={handleChange} placeholder="Misal: db_hris" className={inputUI} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} className={inputUI} required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputUI} />
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Query Executor */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
            <Database size={18} className="text-emerald-500" /> Eksekusi Query
          </h3>

          <div className="mb-5">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Simpan Sebagai (Nama Dataset)</label>
            <div className="relative">
              <HardDrive size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" name="dataset_name" value={formData.dataset_name} onChange={handleChange} className={`${inputUI} pl-11`} required />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">SQL Query</label>
            <textarea 
              name="query" value={formData.query} onChange={handleChange} 
              className="flex-1 w-full bg-slate-900 text-emerald-400 p-5 rounded-2xl font-mono text-sm outline-none resize-none shadow-inner border border-slate-800 focus:ring-2 focus:ring-emerald-500/50"
              required
              rows={8}
            ></textarea>
            <p className="text-xs text-slate-400 mt-2">*Tulis query SELECT untuk menarik data yang diinginkan.</p>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <span className="whitespace-pre-wrap">{error}</span>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-95 disabled:opacity-50">
              {loading ? <><Loader2 className="animate-spin" size={20} /> Menghubungkan & Menarik Data...</> : <><Play size={20} /> Eksekusi & Buka di Workspace</>}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
