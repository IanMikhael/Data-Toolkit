export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-10 text-white shadow-lg">
        <h2 className="text-4xl font-bold mb-4">Your All-in-One<br/>Data Science Toolkit</h2>
        <p className="text-blue-100 text-lg max-w-xl">
          Work faster with powerful tools for data analysis, visualization, and automation right on your local machine.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-xl font-bold text-slate-800 mb-2">1. Data Explorer</h3>
           <p className="text-slate-500">Upload file Excel/CSV Anda, bersihkan data, ubah tipe data, dan rapikan nama kolom dengan antarmuka point-and-click.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-xl font-bold text-slate-800 mb-2">2. Analysis (SQL)</h3>
           <p className="text-slate-500">Tulis dan eksekusi query SQL tingkat lanjut langsung ke file Anda secara instan menggunakan DuckDB Engine.</p>
        </div>
      </div>
    </div>
  );
}
