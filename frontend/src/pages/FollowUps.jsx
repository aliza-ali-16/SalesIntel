import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  Flame, 
  Thermometer, 
  Snowflake,
  AlertCircle
} from 'lucide-react';

export default function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/agents/followups');
      setFollowups(response.data);
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleCompleteTask = async (id) => {
    try {
      setCompletingId(id);
      await axios.post(`/agents/followups/${id}/complete`);
      // Update state locally to animate checkmark change
      setFollowups(prev => prev.map(item => 
        item._id === id ? { ...item, status: 'completed' } : item
      ));
    } catch (err) {
      console.error('Failed to complete followup task:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const getTemperatureIndicator = (category) => {
    switch (category) {
      case 'HOT':
        return <Flame className="text-red-500 fill-red-500/10" size={16} />;
      case 'WARM':
        return <Thermometer className="text-yellow-500 fill-yellow-500/10" size={16} />;
      default:
        return <Snowflake className="text-blue-500 fill-blue-500/10" size={16} />;
    }
  };

  // Group task timeline thresholds
  const pendingTasks = followups.filter(f => f.status === 'pending');
  const completedTasks = followups.filter(f => f.status === 'completed');

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Pending Tasks Column */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Clock size={16} className="text-accentPurple" />
            <span>Active Timeline Tasks</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-accentPurple/10 text-accentPurple text-xs font-bold">
            {pendingTasks.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-accentPurple border-t-transparent"></div>
          </div>
        ) : pendingTasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/5 text-slate-500">
            <CheckCircle2 className="text-accentEmerald mx-auto mb-2" size={24} />
            <p className="text-sm font-semibold">All outreach complete!</p>
            <p className="text-xs text-slate-400 mt-0.5">No pending follow-ups scheduled at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div 
                key={task._id} 
                className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm border border-slate-200 dark:border-slate-800 hover:scale-[1.005] transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#121420] text-slate-500 mt-0.5">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{task.customer?.name || 'Customer'}</span>
                      {getTemperatureIndicator(task.customer?.category)}
                    </h3>
                    <p className="text-xs font-mono-custom text-slate-500 mt-1">{task.customer?.email}</p>
                    
                    <div className="flex items-center space-x-1.5 mt-2.5 text-xs text-slate-500 font-semibold">
                      <Calendar size={13} />
                      <span>Scheduled Outreach Date: {task.date}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCompleteTask(task._id)}
                  disabled={completingId === task._id}
                  className="flex items-center justify-center space-x-1 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  <CheckCircle2 size={13} className="text-accentEmerald" />
                  <span>{completingId === task._id ? 'Processing...' : 'Complete'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Archive Column */}
      <div className="md:col-span-1 space-y-4">
        <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-accentEmerald" />
            <span>Task Archive</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accentPurple border-t-transparent"></div>
          </div>
        ) : completedTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No completed tasks yet. Mark active schedules to build archive history.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {completedTasks.map((task) => (
              <div 
                key={task._id} 
                className="p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-900/60 bg-slate-100/30 dark:bg-[#121420]/20 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-slate-600 dark:text-slate-400 line-through">{task.customer?.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 font-mono-custom mt-0.5 truncate max-w-[150px]">{task.customer?.email}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-semibold uppercase tracking-wider text-[9px]">
                    Done
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">Plan: {task.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
