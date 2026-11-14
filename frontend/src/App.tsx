import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import DataExplorer from './pages/DataExplorer';
import DatabaseConnector from './pages/DatabaseConnector';
import Analysis from './pages/Analysis';
import Visualization from './pages/Visualization';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

// Komponen pelindung rute
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Semua rute di dalam ini wajib login */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="data-explorer" element={<DataExplorer />} />
          <Route path="databases" element={<DatabaseConnector />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="visualization" element={<Visualization />} />
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
