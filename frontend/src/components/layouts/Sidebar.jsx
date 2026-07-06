import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Users, 
  Mail, 
  Settings, 
  LogOut, 
  Database, 
  Cpu, 
  Sun, 
  Moon,
  X,
  BarChart3,
  CheckSquare
} from 'lucide-react';

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sysStatus, setSysStatus] = useState({ database: 'Connecting...', agents: 'Checking...' });
  const [theme, setTheme] = useState(document.body.classList.contains('dark') ? 'dark' : 'light');

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/status');
      setSysStatus({
        database: response.data.database === 'MongoDB_Connected' ? 'MongoDB' : 'JSON DB',
        agents: response.data.agents === 'Embedded_Node_Engine' ? 'Node Agent' : 'FastAPI AI'
      });
    } catch (err) {
      setSysStatus({ database: 'Offline', agents: 'Offline' });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    if (document.body.classList.contains('dark')) {
      document.body.classList.remove('dark');
      setTheme('light');
    } else {
      document.body.classList.add('dark');
      setTheme('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Leads Map', path: '/leads', icon: Users },
    { name: 'Approvals', path: '/approvals', icon: CheckSquare },
    { name: 'Email Center', path: '/emails', icon: Mail },
    { name: 'AI Agents', path: '/agents', icon: Cpu },
    { name: 'Upload CRM', path: '/upload', icon: UploadCloud },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Sidebar container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform flex-col border-r 
        bg-white text-slate-800 transition-transform duration-300 ease-in-out dark:bg-[#0c0d14]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        border-slate-200 dark:border-slate-800 flex justify-between
      `}>
        {/* Top Header */}
        <div className="flex flex-col flex-1 py-6 overflow-y-auto">
          <div className="flex items-center justify-between px-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-accentPurple to-accentIndigo text-white font-bold text-lg shadow-md">
                Ω
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Sales<span className="text-accentPurple font-medium">Intel</span>
              </span>
            </div>
            <button 
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-accentPurple/10 to-accentIndigo/10 text-accentPurple border-l-4 border-accentPurple font-semibold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-white border-l-4 border-transparent'
                  }
                `}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Profile and Systems */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          {/* Health Stats */}
          <div className="mb-4 space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#121420] border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Database size={13} />
                <span>Database:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <span className={`h-1.5 w-1.5 rounded-full ${sysStatus.database === 'Offline' ? 'bg-red-500' : sysStatus.database === 'JSON DB' ? 'bg-yellow-500 animate-pulse' : 'bg-accentEmerald animate-pulse'}`}></span>
                <span>{sysStatus.database}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#121420] border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Cpu size={13} />
                <span>AI Engine:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-semibold text-slate-700 dark:text-slate-200">
                <span className={`h-1.5 w-1.5 rounded-full ${sysStatus.agents === 'Offline' ? 'bg-red-500' : 'bg-accentPurple animate-pulse'}`}></span>
                <span>{sysStatus.agents}</span>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/50 dark:bg-slate-900/40">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accentPurple text-white font-bold shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">{user?.name || 'Developer'}</p>
                <p className="text-xs truncate text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full space-x-2 px-4 py-2.5 mt-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-all duration-205"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile background mask */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
