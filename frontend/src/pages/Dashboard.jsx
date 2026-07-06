import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Users, 
  Flame, 
  Percent, 
  DollarSign, 
  Cpu, 
  CheckSquare, 
  Sparkles,
  Upload,
  ArrowUpRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    conversionProbability: '0%',
    expectedRevenue: '$0',
    activeAgents: 6,
    pendingApprovals: 0
  });

  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [predictionData, setPredictionData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and emails (for pending approvals count) concurrently
      const [statsRes, emailsRes] = await Promise.all([
        axios.get('/agents/dashboard-stats'),
        axios.get('/agents/emails')
      ]);

      const { stats: fetchedStats, distribution, engagement, agentPerformance } = statsRes.data;
      const pendingCount = emailsRes.data.filter(e => e.status === 'pending').length;

      setStats({
        totalLeads: fetchedStats.totalLeads,
        hotLeads: fetchedStats.hotLeads,
        conversionProbability: fetchedStats.totalLeads > 0 
          ? `${fetchedStats.conversionRate}%` 
          : '0%',
        expectedRevenue: fetchedStats.expectedRevenue,
        activeAgents: agentPerformance.length || 6,
        pendingApprovals: pendingCount
      });

      setPieData(distribution);
      setBarData(engagement);
      setAgentPerformance(agentPerformance);

      // Generate Sales Pipeline prediction chart trends
      const rawRevenue = parseInt(fetchedStats.expectedRevenue.replace(/[^0-9]/g, '')) || 5000;
      setPredictionData([
        { month: 'Jul', ExpectedRevenue: Math.round(rawRevenue * 0.85) },
        { month: 'Aug', ExpectedRevenue: Math.round(rawRevenue * 1.0) },
        { month: 'Sep', ExpectedRevenue: Math.round(rawRevenue * 1.25) },
        { month: 'Oct', ExpectedRevenue: Math.round(rawRevenue * 1.5) },
        { month: 'Nov', ExpectedRevenue: Math.round(rawRevenue * 1.9) },
        { month: 'Dec', ExpectedRevenue: Math.round(rawRevenue * 2.4) }
      ]);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#08090d]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accentPurple border-t-transparent"></div>
      </div>
    );
  }

  // Staggered Framer Motion grid options
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
  };

  const kpiCards = [
    { 
      name: 'Total Leads', 
      value: stats.totalLeads, 
      growth: '↑ 14%', 
      trend: 'Lead Intake', 
      icon: Users, 
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/10' 
    },
    { 
      name: 'Hot Leads', 
      value: stats.hotLeads, 
      growth: '↑ 21%', 
      trend: 'High Priority', 
      icon: Flame, 
      color: 'text-red-500 bg-red-500/10 border-red-500/10' 
    },
    { 
      name: 'Conversion Prob.', 
      value: stats.conversionProbability, 
      growth: '↑ 8%', 
      trend: 'Avg Success', 
      icon: Percent, 
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10' 
    },
    { 
      name: 'Expected Revenue', 
      value: stats.expectedRevenue, 
      growth: '↑ 23%', 
      trend: 'AI Prediction', 
      icon: DollarSign, 
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/10' 
    },
    { 
      name: 'Active AI Agents', 
      value: `${stats.activeAgents} / 6`, 
      growth: '100%', 
      trend: 'Sim Status', 
      icon: Cpu, 
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/10' 
    },
    { 
      name: 'Pending Approvals', 
      value: stats.pendingApprovals, 
      growth: stats.pendingApprovals > 0 ? 'Action required' : 'Clear', 
      trend: 'Human Review', 
      icon: CheckSquare, 
      color: stats.pendingApprovals > 0 ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/10' : 'text-slate-400 bg-slate-400/10 border-slate-400/10' 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-r from-accentPurple/10 via-accentIndigo/10 to-transparent border border-accentPurple/15 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="text-accentPurple" size={20} />
            <span>AI Sales Intelligence Multi-Agent Platform</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            CRM details are analyzed, scored, and composed. Approve outreaches and monitor agent latency in real-time.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Link 
            to="/upload" 
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-accentPurple to-accentIndigo text-white rounded-xl text-sm font-semibold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            <Upload size={16} />
            <span>Upload CRM File</span>
          </Link>
        </div>
      </motion.div>

      {stats.totalLeads === 0 ? (
        /* Empty Dashboard State */
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/10"
        >
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No CRM Data Ingested</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center mt-1.5">
            Get started by uploading a customer CSV contacts file containing name, email, website visits, opens, and purchase history.
          </p>
          <Link to="/upload" className="mt-6 flex items-center space-x-1.5 px-4 py-2 bg-accentPurple text-white rounded-xl text-sm font-semibold hover:bg-accentViolet shadow-sm">
            <span>Upload CSV</span>
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      ) : (
        /* Full Dashboard Grid */
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Top KPI Cards Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {kpiCards.map((card, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="glass-panel p-5 rounded-2xl glow-card shadow-sm border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.name}</span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <card.icon size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{card.value}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] border-t border-slate-100 dark:border-slate-900 pt-2 font-medium">
                  <span className="text-emerald-500 font-bold flex items-center space-x-0.5">
                    <TrendingUp size={10} className="mr-0.5" />
                    {card.growth}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-semibold">{card.trend}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Lead Distribution Pie Chart */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 col-span-1 flex flex-col justify-between shadow-sm"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Activity size={13} className="text-accentPurple" />
                <span>Lead Distribution</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#8b5cf6'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0e101a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-around text-[10px] mt-2 font-semibold">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-slate-600 dark:text-slate-400">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Engagement by Category Bar Chart */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 col-span-1 shadow-sm"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Activity size={13} className="text-accentPurple" />
                <span>Engagement Benchmarks</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0e101a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                    <Bar dataKey="Visits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Opens" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Purchases" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Sales prediction Area Chart */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 col-span-1 shadow-sm"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                <Activity size={13} className="text-accentPurple" />
                <span>Predicted Growth ($)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictionData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0e101a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="ExpectedRevenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Agent Performance Dashboard Row */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Agent Latency Metrics BarChart */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 col-span-2 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Cpu className="text-accentPurple" size={16} />
                  <span>Agent Latency & Performance (ms)</span>
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentPerformance}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0e101a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="averageTime" fill="#a855f7" radius={[4, 4, 0, 0]} name="Avg Latency (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Agent Execution counts */}
            <motion.div 
              variants={itemVariants}
              className="glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/70 dark:bg-[#0c0d14]/70 col-span-1 shadow-sm flex flex-col justify-between"
            >
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Agent Health Status</h3>
              <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                {agentPerformance.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-900">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.name}</span>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-slate-550">Runs: <strong className="text-slate-800 dark:text-white">{p.executions}</strong></span>
                      {p.failures > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold text-[9px]">Failures: {p.failures}</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[9px]">Healthy</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
