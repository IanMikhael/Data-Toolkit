import { NavLink, Outlet } from 'react-router-dom';
import { Database, Home, BarChart2, Zap, Folder, Settings, FileSpreadsheet } from 'lucide-react';

export default function Layout() {
  const menuItems = [
    { path: '/', name: 'Home', icon: Home },
    { path: '/data-explorer', name: 'Data Explorer', icon: FileSpreadsheet },
    { path: '/analysis', name: 'Analysis', icon: Database },
    { path: '/visualization', name: 'Visualization', icon: BarChart2 },
    { path: '/automation', name: 'Automation', icon: Zap },
    { path: '/projects', name: 'Projects', icon: Folder },
    { path: '/settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Data Toolkit</h1>
            <p className="text-xs text-slate-400">Analyze • Automate</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
