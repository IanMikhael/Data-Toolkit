import { ReactNode } from 'react';
import { Home, Database, BarChart2, PieChart, Settings, Zap, FolderDot } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const menus = [
    { name: 'Home', icon: Home, active: true },
    { name: 'Data Explorer', icon: Database },
    { name: 'Analysis', icon: BarChart2 },
    { name: 'Visualization', icon: PieChart },
    { name: 'Automation', icon: Zap },
    { name: 'Projects', icon: FolderDot },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Database size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Data Toolkit</h1>
            <p className="text-xs text-slate-400">Analyze • Automate</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menus.map((menu) => (
            <button
              key={menu.name}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                menu.active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <menu.icon size={18} />
              {menu.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8">
          <input 
            type="text" 
            placeholder="Search tools, features... (Ctrl + K)" 
            className="bg-slate-100 border-none rounded-lg px-4 py-2 w-96 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
