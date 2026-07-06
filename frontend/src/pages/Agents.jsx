import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Play, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  Activity, 
  Bot, 
  Pause, 
  RefreshCw, 
  Database,
  X
} from 'lucide-react';

export default function Agents() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState('idle');
  const terminalRef = useRef(null);

  // Simulated agent states
  const [agents, setAgents] = useState([
    { name: 'CRM Analyzer Agent', status: 'Running', cpu: 34, tasks: 2450, latency: 150, memoryKey: 'crm_analyzer' },
    { name: 'Customer Research Agent', status: 'Idle', cpu: 0, tasks: 1220, latency: 420, memoryKey: 'customer_research' },
    { name: 'Lead Scoring Agent', status: 'Running', cpu: 12, tasks: 1980, latency: 250, memoryKey: 'lead_scoring' },
    { name: 'Sales Strategy Agent', status: 'Idle', cpu: 0, tasks: 870, latency: 180, memoryKey: 'sales_strategy' },
    { name: 'Email Agent', status: 'Idle', cpu: 0, tasks: 310, latency: 320, memoryKey: 'email_agent' },
    { name: 'Revenue Forecast Agent', status: 'Idle', cpu: 0, tasks: 140, latency: 580, memoryKey: 'revenue_forecast' },
  ]);

  // Memory inspect drawer
  const [activeMemoryAgent, setActiveMemoryAgent] = useState(null);
  const [agentMemories, setAgentMemories] = useState([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/agents/logs');
      setLogs(response.data);
      updatePipelineStateFromLogs(response.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePipelineStateFromLogs = (logList) => {
    if (logList.length === 0) {
      setPipelineState('idle');
      return;
    }
    
    const hasError = logList.some(l => l.action.toLowerCase().includes('error'));
    const hasComplete = logList.some(l => l.action.toLowerCase().includes('completed'));
    const hasStoring = logList.some(l => l.action.toLowerCase().includes('mcp memory') || l.action.toLowerCase().includes('persisting'));
    const hasEmail = logList.some(l => l.agentName === 'Email Agent');
    const hasFollowUp = logList.some(l => l.agentName === 'Sales Strategy Agent' || l.agentName === 'Follow-up Agent');
    const hasScoring = logList.some(l => l.agentName === 'Lead Scoring Agent');
    const hasAnalyzer = logList.some(l => l.agentName === 'CRM Analyzer Agent');

    if (hasError) {
      setPipelineState('error');
    } else if (hasComplete) {
      setPipelineState('complete');
    } else if (hasStoring) {
      setPipelineState('storing');
    } else if (hasEmail) {
      setPipelineState('emailing');
    } else if (hasFollowUp) {
      setPipelineState('scheduling');
    } else if (hasScoring) {
      setPipelineState('scoring');
    } else if (hasAnalyzer) {
      setPipelineState('analyzing');
    } else {
      setPipelineState('idle');
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleManualTrigger = async () => {
    try {
      setRunning(true);
      setPipelineState('analyzing');
      
      // Simulate CPU spike on manual trigger
      setAgents(prev => prev.map(a => 
        a.name === 'CRM Analyzer Agent' || a.name === 'Lead Scoring Agent' 
          ? { ...a, cpu: 85, status: 'Running' } 
          : a
      ));

      const mockLog = {
        _id: 'temp-start',
        agentName: 'Manager Agent',
        action: 'Manual diagnostics trigger: Initiating Multi-Agent flow...',
        timestamp: new Date().toISOString()
      };
      setLogs(prev => [mockLog, ...prev]);

      await axios.post('/agents/analyze');
      await fetchLogs();
    } catch (err) {
      console.error(err);
      setPipelineState('error');
    } finally {
      setRunning(false);
      // Reset CPU simulation to idle
      setAgents(prev => prev.map(a => ({ ...a, cpu: a.status === 'Running' ? 15 : 0 })));
    }
  };

  // Agent Actions
  const handleStartAgent = (agentName) => {
    setAgents(prev => prev.map(a => 
      a.name === agentName 
        ? { ...a, status: 'Running', cpu: 15 } 
        : a
    ));
  };

  const handlePauseAgent = (agentName) => {
    setAgents(prev => prev.map(a => 
      a.name === agentName 
        ? { ...a, status: 'Paused', cpu: 0 } 
        : a
    ));
  };

  const handleRestartAgent = (agentName) => {
    setAgents(prev => prev.map(a => 
      a.name === agentName 
        ? { ...a, status: 'Running', cpu: 95 } 
        : a
    ));
    setTimeout(() => {
      setAgents(prev => prev.map(a => 
        a.name === agentName 
          ? { ...a, cpu: 20 } 
          : a
      ));
    }, 1000);
  };

  const handleViewMemory = async (agent) => {
    setActiveMemoryAgent(agent);
    setMemoryLoading(true);
    try {
      // Fetch some memories from VectorDB
      const response = await axios.get('/agents/emails');
      setAgentMemories(response.data.slice(0, 5).map(e => ({
        key: e.customer?.email || 'System Key',
        value: `Dispatched outreach campaign subject: "${e.subject}"`
      })));
    } catch (err) {
      setAgentMemories([
        { key: 'clark@dailyplanet.com', value: 'Saved Campaign outline. Avoid discount offers.' },
        { key: 'bruce@waynecorp.com', value: 'Generated demo invite CTA outline.' }
      ]);
    } finally {
      setMemoryLoading(false);
    }
  };

  const getAgentColor = (name) => {
    switch (name) {
      case 'CRM Analyzer Agent': return 'text-blue-400';
      case 'Lead Scoring Agent': return 'text-indigo-400';
      case 'Customer Research Agent': return 'text-orange-400';
      case 'Sales Strategy Agent': return 'text-pink-400';
      case 'Email Agent': return 'text-emerald-400';
      default: return 'text-purple-400';
    }
  };

  const stages = [
    { key: 'analyzing', name: 'CRM Intel' },
    { key: 'scoring', name: 'Lead Score' },
    { key: 'scheduling', name: 'Sales Strategy' },
    { key: 'emailing', name: 'Email Compose' },
    { key: 'storing', name: 'Memory Save' }
  ];

  const getStageStatus = (stageKey, idx) => {
    const activeIdx = stages.findIndex(s => s.key === pipelineState);
    if (pipelineState === 'complete') return 'completed';
    if (pipelineState === 'error') return 'error';
    if (pipelineState === 'idle') return 'pending';
    
    if (stageKey === pipelineState) return 'active';
    if (idx < activeIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-10rem)]">
      
      {/* 1. Agent Control center Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl glow-card shadow-sm border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 flex flex-col justify-between space-y-4">
            
            {/* Header: Agent metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl bg-slate-100 dark:bg-[#121420] text-slate-500`}>
                  <Cpu size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">{agent.name}</h4>
                  <span className="text-[10px] text-slate-400 block">Latency: {agent.latency}ms</span>
                </div>
              </div>

              {/* Status Indicator */}
              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                agent.status === 'Running' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : agent.status === 'Paused' 
                    ? 'bg-yellow-500/10 text-yellow-500' 
                    : 'bg-slate-500/10 text-slate-500'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${agent.status === 'Running' ? 'bg-emerald-500 animate-pulse' : agent.status === 'Paused' ? 'bg-yellow-500' : 'bg-slate-500'}`}></span>
                <span>{agent.status}</span>
              </span>
            </div>

            {/* Load bar CPU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-semibold">Simulated CPU Load</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">{agent.cpu}%</span>
              </div>
              <div className="bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${agent.cpu}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="bg-accentPurple h-full rounded-full"
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 dark:border-slate-900 pt-3 text-slate-500">
              <div>
                Tasks: <strong className="text-slate-850 dark:text-white">{agent.tasks}</strong>
              </div>
              <div className="text-right">
                Last Run: <strong className="text-slate-850 dark:text-white">Recent</strong>
              </div>
            </div>

            {/* Controls bottom */}
            <div className="flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-900 pt-3">
              {agent.status === 'Running' ? (
                <button 
                  onClick={() => handlePauseAgent(agent.name)}
                  className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-[10px] font-semibold flex items-center space-x-1 flex-1 justify-center"
                >
                  <Pause size={10} />
                  <span>Pause</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleStartAgent(agent.name)}
                  className="p-2 border border-slate-200 dark:border-slate-800 text-emerald-500 hover:bg-emerald-500/5 rounded-xl text-[10px] font-semibold flex items-center space-x-1 flex-1 justify-center"
                >
                  <Play size={10} className="fill-emerald-500" />
                  <span>Start</span>
                </button>
              )}
              
              <button 
                onClick={() => handleRestartAgent(agent.name)}
                className="p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-[10px] font-semibold flex items-center space-x-1"
                title="Restart Agent"
              >
                <RefreshCw size={10} />
              </button>

              <button 
                onClick={() => handleViewMemory(agent)}
                className="p-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-[10px] font-bold flex items-center space-x-1"
              >
                <Database size={10} />
                <span>Memory</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* 2. Visual Pipeline Map */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 shrink-0">
        <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-5 flex items-center space-x-2">
          <Activity size={15} className="text-accentPurple" />
          <span>Active Agent Orchestration pipeline</span>
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
          {stages.map((stage, idx) => {
            const status = getStageStatus(stage.key, idx);
            return (
              <React.Fragment key={stage.key}>
                <div className={`
                  flex flex-col items-center justify-center p-3 rounded-xl border w-full md:w-36 text-center transition-all duration-300
                  ${status === 'active' 
                    ? 'border-accentPurple bg-accentPurple/5 text-accentPurple font-bold agent-active-pulse' 
                    : status === 'completed'
                      ? 'border-accentEmerald/30 bg-accentEmerald/5 text-accentEmerald'
                      : status === 'error'
                        ? 'border-red-500/30 bg-red-500/5 text-red-500'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500'
                  }
                `}>
                  <div className="flex items-center justify-center mb-1">
                    {status === 'completed' ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Bot size={16} className={status === 'active' ? 'animate-spin' : ''} />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{stage.name}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ChevronRight className="hidden md:block text-slate-300 dark:text-slate-700" size={16} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Terminal Console */}
      <div className="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-md">
        
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-[#121420] border-b border-slate-200 dark:border-slate-855 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/30"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500/30"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-500/30"></span>
            </div>
            <div className="flex items-center space-x-1.5 ml-3 font-mono-custom text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <Terminal size={14} />
              <span>agent_orchestrator_console.sh</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLogs([])}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-250 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
              title="Clear Terminal View"
            >
              <Trash2 size={14} />
            </button>
            
            <button
              onClick={handleManualTrigger}
              disabled={running || loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-accentPurple text-white rounded-lg text-xs font-bold shadow hover:bg-accentViolet disabled:opacity-50"
            >
              <Play size={10} className="fill-white" />
              <span>{running ? 'Diagnosing...' : 'Test Run'}</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div ref={terminalRef} className="flex-1 bg-slate-950 p-6 overflow-y-auto font-mono-custom text-xs leading-relaxed text-slate-300 min-h-[220px] select-text">
          {loading ? (
            <div className="flex h-full items-center justify-center text-slate-550">
              Initializing connection...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-550">
              Terminal idle. Run diagnostics or upload a CRM CSV to inspect log sequences.
            </div>
          ) : (
            <div className="space-y-2">
              {[...logs].reverse().map((log, idx) => (
                <div key={log._id || idx} className="terminal-line flex items-start space-x-3">
                  <span className="text-slate-650 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold shrink-0 select-none ${getAgentColor(log.agentName)}`}>
                    [{log.agentName.toUpperCase()}]:
                  </span>
                  <span className="text-slate-100 flex-1 whitespace-pre-wrap">{log.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Memory Drawer Modal */}
      <AnimatePresence>
        {activeMemoryAgent && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setActiveMemoryAgent(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d14] shadow-2xl p-6 z-55 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <Database className="text-accentPurple" size={16} />
                  <span>Agent Memory Indices: {activeMemoryAgent.name}</span>
                </h4>
                <button onClick={() => setActiveMemoryAgent(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {memoryLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Querying memory indexes...</div>
                ) : agentMemories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No context logs indexed.</div>
                ) : (
                  agentMemories.map((m, idx) => (
                    <div key={idx} className="p-3 border border-slate-100 dark:border-slate-900 rounded-xl text-xs space-y-1 bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="font-bold text-accentPurple text-[10px] block font-mono-custom">{m.key}</span>
                      <p className="text-slate-650 dark:text-slate-350 leading-relaxed">{m.value}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
