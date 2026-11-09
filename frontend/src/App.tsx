import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import DataExplorer from './pages/DataExplorer';
import Analysis from './pages/Analysis';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="data-explorer" element={<DataExplorer />} />
          <Route path="analysis" element={<Analysis />} />
          {/* Rute sementara untuk halaman yang belum dibuat */}
          <Route path="*" element={
            <div className="flex h-[60vh] items-center justify-center text-slate-400">
              Fitur ini sedang dalam tahap pengembangan (Coming Soon).
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
