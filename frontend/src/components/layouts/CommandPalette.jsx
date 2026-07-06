import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, User, Mail, Settings, LayoutDashboard, BarChart3, CheckSquare, Cpu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();
  const paletteRef = useRef(null);

  // Listen for CTRL + K keydown globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch leads when palette opens
  useEffect(() => {
    if (isOpen) {
      axios.get('/agents/leads')
        .then(res => setLeads(res.data))
        .catch(err => console.error('Command palette lead load error:', err));
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectPage = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const handleSelectLead = (leadName) => {
    navigate(`/leads?search=${encodeURIComponent(leadName)}`);
    setIsOpen(false);
    setQuery('');
  };

  // Static view shortcuts
  const pageShortcuts = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics panel', path: '/analytics', icon: BarChart3 },
    { name: 'Leads Map', path: '/leads', icon: User },
    { name: 'Human Approvals', path: '/approvals', icon: CheckSquare },
    { name: 'Outreach Emails', path: '/emails', icon: Mail },
    { name: 'AI Agent Controllers', path: '/agents', icon: Cpu },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  // Filtering
  const filteredPages = pageShortcuts.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.email.toLowerCase().includes(query.toLowerCase()) ||
    (l.company && l.company.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            ref={paletteRef}
            className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c0d14]/95 shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            {/* Search Input */}
            <div className="relative p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center">
              <Search className="text-slate-400 dark:text-slate-500 mr-3" size={18} />
              <input
                type="text"
                placeholder="Type a command, page name or lead profile..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-0"
                autoFocus
              />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-mono-custom select-none">
                ESC
              </span>
            </div>

            {/* Results body */}
            <div className="p-2 max-h-96 overflow-y-auto space-y-4">
              
              {/* Navigation Shortcuts */}
              {filteredPages.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">Pages & Tools</h4>
                  <div className="space-y-0.5">
                    {filteredPages.map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPage(page.path)}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#121420]/80 text-left text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <page.icon size={15} className="text-slate-400" />
                        <span className="text-xs font-semibold">{page.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads Matches */}
              {filteredLeads.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">CRM Lead Records</h4>
                  <div className="space-y-0.5">
                    {filteredLeads.map((lead, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLead(lead.name)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#121420]/80 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                          <User size={15} className="text-slate-400" />
                          <div>
                            <span className="text-xs font-bold block">{lead.name}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{lead.email}</span>
                          </div>
                        </div>
                        {lead.company && (
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{lead.company}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPages.length === 0 && filteredLeads.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No matching shortcuts or leads found for "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
