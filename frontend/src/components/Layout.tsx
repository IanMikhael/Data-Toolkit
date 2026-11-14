import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home, FileSpreadsheet, Server, Database, BarChart2, 
  Zap, Folder, Settings, LogOut, ChevronLeft 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Layout() {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', name: 'Home', icon: Home },
    { path: '/data-explorer', name: 'Data Explorer', icon: FileSpreadsheet },
    { path: '/databases', name: 'DB Connector', icon: Server },
    { path: '/analysis', name: 'Analysis (SQL)', icon: Database },
    { path: '/visualization', name: 'Visualization', icon: BarChart2 },
    { path: '/automation', name: 'Automation', icon: Zap },
    { path: '/projects', name: 'Projects', icon: Folder },
    { path: '/settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside 
        className={`${
          isExpanded ? 'w-64' : 'w-20'
        } bg-[#0F172A] text-slate-300 transition-all duration-300 ease-in-out flex flex-col relative z-20 shadow-xl`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-8 bg-blue-600 text-white p-1 rounded-full shadow-lg hover:bg-blue-500 transition-transform z-50"
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${!isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Logo Area */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/50 mb-4 h-20">
          <div className="bg-blue-600 p-2 rounded-xl shrink-0 text-white">
            <Database size={24} />
          </div>
          <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-white font-bold text-lg leading-tight">Data Toolkit</h1>
            <p className="text-slate-400 text-xs">Super Admin</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.name : ""}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/20' 
                    : 'hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={handleLogout}
            title={!isExpanded ? "Logout" : ""}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400"
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${!isExpanded ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 h-screen overflow-y-auto transition-all duration-300">
        <div className="p-8">
           <Outlet />
        </div>
      </main>

    </div>
  );
}
