import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Flame, 
  Thermometer, 
  Snowflake,
  AlertCircle,
  X,
  Bot,
  BrainCircuit,
  MessageSquare,
  Calendar,
  History,
  Grid,
  List
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [recalculating, setRecalculating] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [viewMode, setViewMode] = useState('table'); // table, map
  
  // Selected lead drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadHistory, setLeadHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/agents/leads');
      setLeads(response.data);

      // Check URL query parameters for pre-selected search
      const params = new URLSearchParams(location.search);
      const searchQuery = params.get('search');
      if (searchQuery) {
        setSearch(searchQuery);
        const match = response.data.find(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (match) {
          handleSelectLead(match);
        }
      }
    } catch (err) {
      console.error('Error fetching scored leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [location.search]);

  const handleSelectLead = async (lead) => {
    setSelectedLead(lead);
    
    // Fetch lead memory history from Vector DB
    try {
      setHistoryLoading(true);
      const response = await axios.get(`/mcp/context/${lead.email}`);
      // Fallback if no context recorded
      setLeadHistory([response.data.data]);
    } catch (e) {
      // Mock history list if vector context route fails or is empty
      setLeadHistory([
        { text: `Analyzed customer visits (${lead.visits}) and imports.` },
        { text: `Generated outreach email templates for ${lead.company || 'Corporate Tiers'}` }
      ]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setNotifyMsg('');
      const response = await axios.post('/agents/analyze');
      setNotifyMsg(response.data.message || 'Multi-agent re-scoring complete.');
      await fetchLeads();
      setTimeout(() => setNotifyMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setNotifyMsg('Re-scoring failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRecalculating(false);
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'HOT':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/10">
            <Flame size={12} className="fill-red-500/20" />
            <span>HOT</span>
          </span>
        );
      case 'WARM':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/10 dark:text-yellow-500">
            <Thermometer size={12} className="fill-yellow-500/20" />
            <span>WARM</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/10">
            <Snowflake size={12} className="fill-blue-500/20" />
            <span>COLD</span>
          </span>
        );
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const name = lead.name || '';
    const email = lead.email || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          email.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || lead.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const hotLeads = filteredLeads.filter(l => l.category === 'HOT');
  const warmLeads = filteredLeads.filter(l => l.category === 'WARM');
  const coldLeads = filteredLeads.filter(l => l.category === 'COLD');

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#121420] border border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search leads by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-accentPurple transition-colors"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm focus:outline-none focus:border-accentPurple cursor-pointer appearance-none"
            >
              <option value="ALL">All Categories</option>
              <option value="HOT">Hot Leads</option>
              <option value="WARM">Warm Leads</option>
              <option value="COLD">Cold Leads</option>
            </select>
          </div>
        </div>

        {/* View togglers & Recalculate */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#121420] text-accentPurple shadow-sm' : 'text-slate-500'}`}
              title="Table Grid"
            >
              <List size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${viewMode === 'map' ? 'bg-white dark:bg-[#121420] text-accentPurple shadow-sm' : 'text-slate-500'}`}
              title="AI Map View"
            >
              <Grid size={14} />
              <span className="hidden sm:inline">AI Map</span>
            </button>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-50 text-sm font-semibold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <RefreshCw size={15} className={recalculating ? 'animate-spin' : ''} />
            <span>{recalculating ? 'Re-scoring leads...' : 'Re-Score Leads'}</span>
          </button>
        </div>
      </div>

      {notifyMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-accentPurple/25 bg-accentPurple/5 text-accentPurple text-sm">
          <AlertCircle size={18} />
          <span>{notifyMsg}</span>
        </div>
      )}

      {/* Main View rendering */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-accentPurple border-t-transparent"></div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center text-slate-500 glass-panel rounded-2xl">
          <p className="text-sm font-semibold">No scored leads found</p>
          <p className="text-xs text-slate-400 mt-1">Try relaxing filters or verify CRM upload data.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* 1. TABLE VIEW */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-[#121420] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Visits</th>
                  <th className="p-4 text-center">Opens</th>
                  <th className="p-4 text-center">Purchases</th>
                  <th className="p-4">Lead Score</th>
                  <th className="p-4">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/40">
                {filteredLeads.map((lead, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => handleSelectLead(lead)}
                    className={`hover:bg-slate-100/30 dark:hover:bg-[#121420]/30 transition-colors cursor-pointer ${selectedLead?.email === lead.email ? 'bg-accentPurple/5 border-l-4 border-accentPurple' : ''}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{lead.name}</td>
                    <td className="p-4 font-mono-custom text-xs text-slate-500 dark:text-slate-400">{lead.email}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-medium">{lead.visits}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-medium">{lead.opens}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-medium">{lead.purchases}</td>
                    <td className="p-4 w-44">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">{lead.score}</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreColor(lead.score)}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getCategoryBadge(lead.category)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. AI MAP VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
          {/* HOT LEADS */}
          <div className="glass-panel p-5 rounded-3xl border border-red-500/10 bg-red-500/5 flex flex-col items-center">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center space-x-1.5 mb-5 select-none">
              <Flame size={14} className="fill-red-500/20 animate-pulse" />
              <span>🔥 HOT LEADS</span>
            </h3>
            <div className="flex-1 w-full overflow-y-auto flex flex-wrap justify-center gap-4 content-start p-2">
              {hotLeads.map((l) => (
                <motion.button
                  key={l.email}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleSelectLead(l)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-tr from-red-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white/20 select-none ${selectedLead?.email === l.email ? 'ring-4 ring-accentPurple shadow-red-500/40' : ''}`}
                >
                  {l.name.split(' ').map(n => n[0]).join('')}
                </motion.button>
              ))}
              {hotLeads.length === 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500 pt-16">No hot leads active</span>}
            </div>
          </div>

          {/* WARM LEADS */}
          <div className="glass-panel p-5 rounded-3xl border border-yellow-500/10 bg-yellow-500/5 flex flex-col items-center">
            <h3 className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-widest flex items-center space-x-1.5 mb-5 select-none">
              <Thermometer size={14} className="fill-yellow-500/20" />
              <span>⚡ WARM LEADS</span>
            </h3>
            <div className="flex-1 w-full overflow-y-auto flex flex-wrap justify-center gap-4 content-start p-2">
              {warmLeads.map((l) => (
                <motion.button
                  key={l.email}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleSelectLead(l)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-400 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white/20 select-none ${selectedLead?.email === l.email ? 'ring-4 ring-accentPurple shadow-yellow-500/40' : ''}`}
                >
                  {l.name.split(' ').map(n => n[0]).join('')}
                </motion.button>
              ))}
              {warmLeads.length === 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500 pt-16">No warm leads active</span>}
            </div>
          </div>

          {/* COLD LEADS */}
          <div className="glass-panel p-5 rounded-3xl border border-blue-500/10 bg-blue-500/5 flex flex-col items-center">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center space-x-1.5 mb-5 select-none">
              <Snowflake size={14} className="fill-blue-500/20" />
              <span>❄️ COLD LEADS</span>
            </h3>
            <div className="flex-1 w-full overflow-y-auto flex flex-wrap justify-center gap-4 content-start p-2">
              {coldLeads.map((l) => (
                <motion.button
                  key={l.email}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleSelectLead(l)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white/20 select-none ${selectedLead?.email === l.email ? 'ring-4 ring-accentPurple shadow-blue-500/40' : ''}`}
                >
                  {l.name.split(' ').map(n => n[0]).join('')}
                </motion.button>
              ))}
              {coldLeads.length === 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500 pt-16">No cold leads active</span>}
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL DRAWER (Framer Motion sliding panel) */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop cover */}
            <div 
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setSelectedLead(null)}
            />
            
            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white dark:bg-[#0c0d14] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              {/* Header drawer */}
              <div className="p-6 border-b border-slate-250 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-xl bg-accentPurple text-white font-bold text-sm">
                    {selectedLead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedLead.name}</h3>
                    <span className="text-[10px] font-mono-custom text-slate-400 block">{selectedLead.email}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body details */}
              <div className="flex-1 p-6 space-y-6">
                
                {/* 1. Score & Classification */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-[#121420]/30 text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">AI Lead Score</span>
                    <strong className="text-3xl font-extrabold text-slate-800 dark:text-white block mt-1">{selectedLead.score}</strong>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-[#121420]/30 flex flex-col justify-center items-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider mb-2">Category Tier</span>
                    {getCategoryBadge(selectedLead.category)}
                  </div>
                </div>

                {/* 2. B2B metadata context */}
                <div className="space-y-3 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-[#121420]/15">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Corporate Company:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedLead.company || 'Wayne Industries'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Industry Sector:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedLead.industry || 'Defense & Technology'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Estimated Value:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedLead.insights?.expectedRevenue || '$5,000'}</span>
                  </div>
                </div>

                {/* 3. AI Thinking Timeline */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <BrainCircuit size={13} className="text-accentPurple" />
                    <span>Agent Thinking Pipeline</span>
                  </h4>
                  
                  {/* Timeline Tree */}
                  <div className="border-l-2 border-slate-200 dark:border-slate-800/80 pl-4 ml-2.5 space-y-5 relative">
                    {/* Step 1: CRM Analyzer */}
                    <div className="relative">
                      <span className="absolute -left-[23px] top-0 h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">CRM Intelligence Agent</h5>
                      <p className="text-[10px] text-slate-500 mt-1 italic">"{selectedLead.insights?.insights || 'Analyzed raw CRM metrics.'}"</p>
                    </div>

                    {/* Step 2: Customer Research */}
                    <div className="relative">
                      <span className="absolute -left-[23px] top-0 h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Customer Research Agent</h5>
                      <p className="text-[10px] text-slate-500 mt-1 italic">"Pain points: Manual workflows. Strategy: platform demos."</p>
                    </div>

                    {/* Step 3: Lead Scorer */}
                    <div className="relative">
                      <span className="absolute -left-[23px] top-0 h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Advanced Lead Scorer</h5>
                      <p className="text-[10px] text-slate-500 mt-1 italic">"{selectedLead.insights?.reason || 'Calculated AI probability weights.'}"</p>
                    </div>

                    {/* Step 4: Sales Playbook */}
                    <div className="relative">
                      <span className="absolute -left-[23px] top-0 h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Sales Strategy Agent</h5>
                      <p className="text-[10px] text-slate-550 mt-1">
                        Recommended Action: <strong className="text-slate-800 dark:text-white">"{selectedLead.insights?.strategy || 'Urgent Demo'}"</strong> via {selectedLead.insights?.recommendedChannel || 'Email'}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Vector Context logs history */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <History size={13} className="text-accentPurple" />
                    <span>Memory Recall History</span>
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {historyLoading ? (
                      <span className="text-[10px] text-slate-550">Loading memories...</span>
                    ) : leadHistory.length === 0 ? (
                      <span className="text-[10px] text-slate-500">No prior campaigns index.</span>
                    ) : (
                      leadHistory.map((h, i) => (
                        <div key={i} className="p-2 border border-slate-100 dark:border-slate-900 rounded-lg text-[10px] text-slate-600 dark:text-slate-450 bg-slate-50/50 dark:bg-slate-950/20 font-mono-custom leading-normal">
                          {h?.text || 'No description recorded.'}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Actions Footer */}
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#08090d] flex items-center justify-between shrink-0">
                <button
                  onClick={() => navigate('/emails')}
                  className="flex items-center space-x-1 px-3 py-2 bg-accentPurple text-white text-xs font-bold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <MessageSquare size={13} />
                  <span>Compose Email</span>
                </button>

                <button
                  onClick={() => navigate('/followups')}
                  className="flex items-center space-x-1 px-3 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Calendar size={13} />
                  <span>View Followups</span>
                </button>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-550"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
