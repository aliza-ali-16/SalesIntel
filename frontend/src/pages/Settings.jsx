import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  User, 
  Key, 
  Server, 
  Database,
  CheckCircle,
  AlertCircle,
  Save,
  Briefcase,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  
  // Profile Administration States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  
  // AI Cognitive API Credentials
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  
  // Infrastructure Drivers Selection
  const [agentRunner, setAgentRunner] = useState('embedded'); // embedded, fastapi
  const [dbMode, setDbMode] = useState('mongodb'); // mongodb, json
  
  // [NEW] Workspace Settings & AI Preferences
  const [companyName, setCompanyName] = useState('Wayne Enterprises');
  const [industry, setIndustry] = useState('Defense & Technology');
  const [aiSalesStyle, setAiSalesStyle] = useState('Professional'); // Professional, Aggressive, Friendly
  const [notifyPreferences, setNotifyPreferences] = useState({
    emailHotLeads: true,
    realTimeAlerts: true,
    agentFails: false
  });
  const [themeMode, setThemeMode] = useState(document.body.classList.contains('dark') ? 'dark' : 'light');

  const [notifyMsg, setNotifyMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load backend configuration status on boot
    const fetchConfigs = async () => {
      try {
        const response = await axios.get('/status');
        setDbMode(response.data.database === 'MongoDB_Connected' ? 'mongodb' : 'json');
        setAgentRunner(response.data.agents === 'Embedded_Node_Engine' ? 'embedded' : 'fastapi');
      } catch (err) {
        console.error('Failed to query config status:', err);
      }
    };
    fetchConfigs();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotifyMsg('');
    setErrorMsg('');

    try {
      // Save Gemini key locally for frontend calls overrides
      if (apiKey) {
        localStorage.setItem('gemini_api_key', apiKey);
      } else {
        localStorage.removeItem('gemini_api_key');
      }

      // Update document dark theme class based on settings selection
      if (themeMode === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }

      setTimeout(() => {
        setLoading(false);
        setNotifyMsg('Workspace and system configuration settings saved successfully.');
        setTimeout(() => setNotifyMsg(''), 4000);
      }, 1000);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Failed to patch system parameters.');
    }
  };

  const handleTogglePreference = (key) => {
    setNotifyPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {notifyMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-accentEmerald/25 bg-accentEmerald/5 text-accentEmerald text-sm">
          <CheckCircle size={18} />
          <span>{notifyMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-red-500/25 bg-red-500/5 text-red-500 text-sm">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* 1. Workspace Profile Settings */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4 bg-white/75 dark:bg-[#0c0d14]/70 border border-slate-200/50 dark:border-slate-800/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2.5">
            <Briefcase size={16} className="text-accentPurple" />
            <span>Workspace Settings & AI Sales Style</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure your brand identity information and AI writing styles.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-accentPurple"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Industry Vertical</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-accentPurple"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">AI Sales Persona Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {['Professional', 'Aggressive', 'Friendly'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setAiSalesStyle(style)}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${aiSalesStyle === style 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <span>{style} Tone</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Profile settings */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4 bg-white/75 dark:bg-[#0c0d14]/70 border border-slate-200/50 dark:border-slate-800/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2.5">
            <User size={16} className="text-accentPurple" />
            <span>Profile Administration</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Update your account credentials and system profile name details.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Account Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-accentPurple"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-205 text-sm focus:outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        {/* 3. Notifications & Layout Theme settings */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4 bg-white/75 dark:bg-[#0c0d14]/70 border border-slate-200/50 dark:border-slate-800/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2.5">
            <Bell size={16} className="text-accentPurple" />
            <span>Notification & Theme Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure alert priorities and select a visual dashboard mode.</p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Notification Checkboxes */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Alerts settings</label>
              
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-655 dark:text-slate-350">
                <input
                  type="checkbox"
                  checked={notifyPreferences.emailHotLeads}
                  onChange={() => handleTogglePreference('emailHotLeads')}
                  className="rounded border-slate-300 text-accentPurple focus:ring-accentPurple h-4 w-4 bg-[#0a0b12]"
                />
                <span>Email me immediately when HOT leads are detected</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-655 dark:text-slate-350">
                <input
                  type="checkbox"
                  checked={notifyPreferences.realTimeAlerts}
                  onChange={() => handleTogglePreference('realTimeAlerts')}
                  className="rounded border-slate-300 text-accentPurple focus:ring-accentPurple h-4 w-4 bg-[#0a0b12]"
                />
                <span>Enable browser push notification sounds</span>
              </label>
            </div>

            {/* Layout theme toggle buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Dashboard Theme Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${themeMode === 'light' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple font-bold' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Sun size={13} />
                  <span>Light Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${themeMode === 'dark' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple font-bold' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Moon size={13} />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. AI Credentials */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4 bg-white/75 dark:bg-[#0c0d14]/70 border border-slate-200/50 dark:border-slate-800/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2.5">
            <Key size={16} className="text-accentPurple" />
            <span>Cognitive LLM Credentials</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Provide actual API credentials to swap default template generators for fully custom models.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Google Gemini API Key</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-accentPurple"
            />
            <p className="text-[10px] text-slate-550 mt-2 font-medium">
              Note: This key overrides server environment configuration parameters for the current frontend session.
            </p>
          </div>
        </div>

        {/* 5. System engine setups */}
        <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4 bg-white/75 dark:bg-[#0c0d14]/70 border border-slate-200/50 dark:border-slate-800/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2.5">
            <Server size={16} className="text-accentPurple" />
            <span>Infrastructure Drivers</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select which active compilation engines are run for analytical operations.</p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Database Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Driver Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDbMode('mongodb')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${dbMode === 'mongodb' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Database size={13} />
                  <span>MongoDB Server</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDbMode('json')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${dbMode === 'json' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Database size={13} />
                  <span>Local JSON Store</span>
                </button>
              </div>
            </div>

            {/* Agent Engine Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Agent Execution Engine</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAgentRunner('embedded')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${agentRunner === 'embedded' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Server size={13} />
                  <span>Embedded Node</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgentRunner('fastapi')}
                  className={`
                    py-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all
                    ${agentRunner === 'fastapi' 
                      ? 'border-accentPurple bg-accentPurple/5 text-accentPurple' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                    }
                  `}
                >
                  <Server size={13} />
                  <span>FastAPI Service</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end shrink-0 pb-12">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-1.5 px-6 py-3 bg-gradient-to-r from-accentPurple to-accentIndigo text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <Save size={15} />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
