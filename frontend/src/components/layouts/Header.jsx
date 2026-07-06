import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, AlertTriangle, Sparkles, Cpu, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';

export default function Header({ setIsMobileOpen, pageTitle }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, text: '🔥 Pipeline ready: Upload CRM to start analytics.', type: 'info', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Format current date
  const formatDate = () => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Socket.IO notification listener
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace('/api', '');
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('socket_connected', (data) => {
      console.log('⚡ [SOCKET] Connection notification registered in Header');
    });

    // Listen to real-time events emitted from backend
    socket.on('agent_status', (data) => {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          text: `🤖 Agent: ${data.agentName} is ${data.status}`, 
          type: 'agent', 
          read: false 
        },
        ...prev
      ]);
    });

    socket.on('new_lead', (data) => {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          text: `🔥 Hot lead detected: ${data.name} (${data.score}/100)`, 
          type: 'lead', 
          read: false 
        },
        ...prev
      ]);
    });

    socket.on('email_generated', (data) => {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          text: `📧 Outreach email drafted for ${data.customerName || 'Lead'}`, 
          type: 'email', 
          read: false 
        },
        ...prev
      ]);
    });

    socket.on('agent_error', (data) => {
      setNotifications(prev => [
        { 
          id: Date.now(), 
          text: `⚠️ Agent Error: ${data.message || 'Failure occurred'}`, 
          type: 'error', 
          read: false 
        },
        ...prev
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-white/70 dark:bg-[#08090d]/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
      <div className="flex items-center space-x-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 md:hidden"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl flex items-center space-x-2">
          <span>{pageTitle}</span>
          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 font-mono-custom">
            CTRL + K
          </span>
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification center widget */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 border border-slate-250 dark:border-slate-800/80 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl relative cursor-pointer"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accentPurple animate-ping"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d14] shadow-2xl p-4 space-y-3 z-50 text-xs text-slate-850 dark:text-slate-300 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2">
                  <h4 className="font-bold">Real-time alerts</h4>
                  <button onClick={markAllRead} className="text-[10px] font-bold text-accentPurple hover:underline">
                    Mark read
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 border rounded-xl flex items-start gap-2.5 transition-all ${n.read ? 'border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-950/10' : 'border-accentPurple/20 bg-accentPurple/5 text-slate-800 dark:text-white'}`}>
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'error' ? (
                          <AlertTriangle className="text-red-500" size={13} />
                        ) : n.type === 'lead' ? (
                          <Sparkles className="text-yellow-500" size={13} />
                        ) : n.type === 'email' ? (
                          <Mail className="text-emerald-500" size={13} />
                        ) : (
                          <Cpu className="text-accentPurple" size={13} />
                        )}
                      </div>
                      <p className="leading-snug">{n.text}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-6 text-slate-400">No recent updates</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date and Time badge */}
        <div className="hidden px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 md:block">
          {formatDate()}
        </div>

        {/* Welcome indicator */}
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-accentEmerald animate-pulse"></span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active: <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
