import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, Bot, Sparkles, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your AI Sales Assistant. Ask me to find the hottest leads, explain a lead score, or look up upsell opportunities.' }
  ]);
  const [leads, setLeads] = useState([]);
  const chatEndRef = useRef(null);

  // Load leads for dynamic query responses
  useEffect(() => {
    if (isOpen) {
      axios.get('/agents/leads')
        .then(res => setLeads(res.data))
        .catch(err => console.error('Chatbot failed to query leads:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(text);
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 800);
  };

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();

    // 1. Show hottest leads
    if (q.includes('hot') || q.includes('hottest') || q.includes('top leads')) {
      const hotList = [...leads]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      if (hotList.length === 0) {
        return "I couldn't find any leads in the database yet. Please upload a CRM list in the Upload Center.";
      }
      
      const leadsStr = hotList.map((l, i) => 
        `${i + 1}. **${l.name}** (Score: ${l.score}/100 - ${l.category}) at ${l.company || 'Corporate'}`
      ).join('\n');
      
      return `Here are the top hottest leads in your pipeline:\n\n${leadsStr}\n\nI recommend sending outbound drafts for these immediately.`;
    }

    // 2. Explain specific lead score
    if (q.includes('explain') || q.includes('score of') || q.includes('why')) {
      // Find matches in leads
      const matched = leads.find(l => q.includes(l.name.toLowerCase()));
      if (matched) {
        return `**${matched.name}** has a lead score of **${matched.score}/100** (${matched.category} tier).\n\n**Engagement Metrics:**\n- Website visits: ${matched.visits}\n- Email opens: ${matched.opens}\n- Purchases: ${matched.purchases}\n\n**AI Reason:**\n"${matched.insights?.reason || 'Standard engagement activity ratios.'}"`;
      }
      return "I can explain any lead score. Try typing: 'Explain Bruce Wayne' or 'Why is Clark Kent scored this way?'";
    }

    // 3. Find opportunities
    if (q.includes('opportunity') || q.includes('upsell') || q.includes('opportunities')) {
      const opportunities = leads
        .filter(l => l.insights?.opportunities && l.insights?.opportunities !== 'None')
        .slice(0, 4);

      if (opportunities.length === 0) {
        return "I couldn't identify specific upsell opportunities right now. Keep monitoring active customer visits.";
      }

      const oppsStr = opportunities.map(l => 
        `- **${l.name}** (${l.company}): *${l.insights.opportunities}* (Priority: ${l.insights.priority})`
      ).join('\n');

      return `Here are the top B2B up-sell and product sync opportunities identified by the agents:\n\n${oppsStr}`;
    }

    // Default Fallback
    return "I am connected to the live multi-agent database. You can ask me:\n\n- 'Show me hottest leads'\n- 'Explain Bruce Wayne's score'\n- 'Find active opportunities'";
  };

  const presetQuestions = [
    'Show me hottest leads',
    'Explain Clark Kent',
    'Find active opportunities'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 h-[480px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d14] shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-accentPurple to-accentIndigo text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1 bg-white/10 rounded-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Sales AI Copilot</h3>
                  <span className="text-[10px] text-white/70 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accentEmerald animate-pulse"></span>
                    <span>Ready</span>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-1.5 rounded-xl text-white shrink-0 ${msg.sender === 'user' ? 'bg-accentIndigo' : 'bg-slate-800'}`}>
                    {msg.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs max-w-[78%] leading-relaxed whitespace-pre-line border ${
                    msg.sender === 'user'
                      ? 'bg-accentPurple/10 border-accentPurple/25 text-slate-800 dark:text-slate-100 rounded-tr-none'
                      : 'bg-white dark:bg-[#121420] border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Presets */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-[#0c0d14] flex flex-wrap gap-1.5 shrink-0">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d14] flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask Sales AI Copilot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-accentPurple text-slate-800 dark:text-slate-100"
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-2 bg-accentPurple text-white rounded-xl hover:bg-accentViolet shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center h-12 w-12 bg-gradient-to-tr from-accentPurple to-accentIndigo text-white rounded-full shadow-2xl relative cursor-pointer border border-white/10"
        title="AI Assistant"
      >
        <Sparkles size={18} className="absolute top-1 right-1 text-yellow-300 animate-pulse" />
        <MessageSquare size={20} />
      </motion.button>
    </div>
  );
}
