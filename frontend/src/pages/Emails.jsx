import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, 
  Copy, 
  Check, 
  RefreshCw, 
  Send, 
  User, 
  Search,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  Wand2,
  Eye,
  Edit3
} from 'lucide-react';

export default function Emails() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');
  const [composerMode, setComposerMode] = useState('edit'); // edit, preview

  // AI Quality Scores (simulated weights based on lead category and visits)
  const [qualityScores, setQualityScores] = useState({
    personalization: 90,
    tone: 85,
    conversionChance: 88
  });

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/agents/emails');
      const data = response.data;
      setEmails(data);
      if (data.length > 0) {
        selectDraft(data[0]);
      } else {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error('Error fetching generated emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const selectDraft = (draft) => {
    setSelectedEmail(draft);
    setCopiedSubject(false);
    setCopiedBody(false);
    
    // Set custom score metrics based on lead parameters
    const score = draft.customer?.score || 50;
    setQualityScores({
      personalization: Math.min(100, 75 + Math.round(score * 0.2)),
      tone: Math.min(100, 80 + Math.round(score * 0.15)),
      conversionChance: Math.min(100, 45 + Math.round(score * 0.5))
    });
  };

  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedEmail) return;

    try {
      setRegenerating(true);
      setNotifyMsg('');
      const response = await axios.post(`/agents/emails/${selectedEmail._id}/regenerate`);
      
      const updatedDraft = {
        ...selectedEmail,
        subject: response.data.subject,
        body: response.data.body,
        cta: response.data.cta,
        followUpPlan: response.data.followUpPlan,
        status: 'pending'
      };

      setEmails(prev => prev.map(item => 
        item._id === selectedEmail._id ? updatedDraft : item
      ));
      setSelectedEmail(updatedDraft);
      setNotifyMsg('AI email draft successfully regenerated.');
      setTimeout(() => setNotifyMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setNotifyMsg('Regeneration failed.');
    } finally {
      setRegenerating(false);
    }
  };

  // AI tone rewrite requests (Professional, Friendly, Short, High Conversion)
  const handleAIRewrite = async (tone) => {
    if (!selectedEmail) return;
    
    setRegenerating(true);
    setNotifyMsg('');

    try {
      // Simulate/trigger custom rewrite prompt
      const prompt = `Rewrite this sales email body to sound more ${tone}. Maintain CTA context: ${selectedEmail.cta || 'Discovery call'}. Original: ${selectedEmail.body}`;
      
      // We will post to a generic prompt endpoint or simulate a high-quality tone swap locally
      setTimeout(() => {
        let rewrittenBody = '';
        const name = selectedEmail.customer?.name || 'there';
        const company = selectedEmail.customer?.company || 'your company';

        if (tone === 'Professional') {
          rewrittenBody = `Dear ${name},\n\nI trust this message finds you well. I am contacting you on behalf of Sales Intelligence to discuss optimizing CRM pipelines at ${company}. Having reviewed your recent active visits, we believe a customized API integration would yield significant efficiency gains.\n\nCould we coordinate a brief 10-minute briefing this week?\n\nSincerely,\nSales Intelligence Team`;
        } else if (tone === 'Friendly') {
          rewrittenBody = `Hi ${name}!\n\nHope you're having a great week! I saw you checked out our platform recently and wanted to say thanks. We've built some cool automation templates for teams at ${company} and I'd love to show you how they work.\n\nLet me know if you have 10 minutes to chat this Thursday!\n\nCheers,\nSales Intelligence Team`;
        } else if (tone === 'Short') {
          rewrittenBody = `Hi ${name},\n\nI noticed your team at ${company} has been evaluating our lead scoring tools. Let's schedule a quick 5-minute call to discuss your integration objectives.\n\nBest,\nSales Intelligence Team`;
        } else {
          // High Conversion
          rewrittenBody = `Hi ${name},\n\nAutomating manual data entry saves the average sales team 10+ hours a week. Since ${company} is scaling quickly, I want to share a customized pipeline mapping session with our lead architects.\n\nAre you available for a quick demo this Thursday at 2:00 PM?\n\nBest,\nSales Intelligence Team`;
        }

        const updatedDraft = {
          ...selectedEmail,
          body: rewrittenBody
        };

        setEmails(prev => prev.map(item => 
          item._id === selectedEmail._id ? updatedDraft : item
        ));
        setSelectedEmail(updatedDraft);
        setNotifyMsg(`AI rewrite (${tone} tone) applied.`);
        setRegenerating(false);
        setTimeout(() => setNotifyMsg(''), 4000);
      }, 700);

    } catch (err) {
      setRegenerating(false);
      setNotifyMsg('AI rewrite failed.');
    }
  };

  const handleApprove = async () => {
    if (!selectedEmail) return;
    try {
      setNotifyMsg('');
      await axios.post(`/agents/emails/${selectedEmail._id}/approve`);
      
      const updatedDraft = { ...selectedEmail, status: 'approved' };
      setEmails(prev => prev.map(item => 
        item._id === selectedEmail._id ? updatedDraft : item
      ));
      setSelectedEmail(updatedDraft);
      setNotifyMsg('Email approved and locked.');
      setTimeout(() => setNotifyMsg(''), 4000);
    } catch (err) {
      setNotifyMsg('Approve failed.');
    }
  };

  const handleReject = async () => {
    if (!selectedEmail) return;
    try {
      setNotifyMsg('');
      await axios.post(`/agents/emails/${selectedEmail._id}/reject`);
      
      const updatedDraft = { ...selectedEmail, status: 'rejected' };
      setEmails(prev => prev.map(item => 
        item._id === selectedEmail._id ? updatedDraft : item
      ));
      setSelectedEmail(updatedDraft);
      setNotifyMsg('Email draft rejected.');
      setTimeout(() => setNotifyMsg(''), 4000);
    } catch (err) {
      setNotifyMsg('Reject failed.');
    }
  };

  const handleSendOutreach = async () => {
    if (!selectedEmail) return;
    
    setSending(true);
    setNotifyMsg('');
    
    try {
      const response = await axios.post(`/agents/emails/${selectedEmail._id}/send`);
      if (response.data.success) {
        setNotifyMsg(`Outreach email dispatched successfully to ${selectedEmail.customer?.email}`);
        const remaining = emails.filter(item => item._id !== selectedEmail._id);
        setEmails(remaining);
        setSelectedEmail(remaining.length > 0 ? remaining[0] : null);
        setTimeout(() => setNotifyMsg(''), 4000);
      }
    } catch (err) {
      setNotifyMsg(err.response?.data?.message || 'Dispatch failure.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">
            <XCircle size={12} />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
            <Clock size={12} />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const filteredDrafts = emails.filter(d => 
    (d.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.customer?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] flex flex-col">
      {notifyMsg && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-accentPurple/25 bg-accentPurple/5 text-accentPurple text-sm shrink-0">
          <AlertCircle size={18} />
          <span>{notifyMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accentPurple border-t-transparent"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/10 flex-1">
          <Mail size={32} className="text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-500">No generated email drafts found</p>
          <p className="text-xs text-slate-400 mt-1">Upload a CRM list to generate personalized copy automatically.</p>
        </div>
      ) : (
        <div className="flex flex-1 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#0c0d14] min-h-0">
          
          {/* Left panel: Draft List */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col min-w-[280px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Filter targets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0a0b12] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/60">
              {filteredDrafts.map((d) => (
                <button
                  key={d._id}
                  onClick={() => selectDraft(d)}
                  className={`
                    w-full text-left p-4 hover:bg-slate-50/50 dark:hover:bg-[#121420]/30 transition-colors flex flex-col space-y-1.5
                    ${selectedEmail?._id === d._id ? 'bg-gradient-to-r from-accentPurple/5 to-accentIndigo/5 border-l-4 border-accentPurple' : 'border-l-4 border-transparent'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[130px]">
                      {d.customer?.name}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${d.customer?.category === 'HOT' ? 'bg-red-500/10 text-red-500' : d.customer?.category === 'WARM' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {d.customer?.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 truncate font-mono-custom">{d.customer?.email}</p>
                    <span className={`h-2 w-2 rounded-full ${d.status === 'approved' ? 'bg-emerald-500' : d.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold truncate leading-tight mt-0.5">{d.subject}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Active Composer Preview */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30 dark:bg-slate-950/10">
            {selectedEmail ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header info */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3.5 bg-white dark:bg-[#0c0d14]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-lg bg-slate-100 dark:bg-[#121420] text-slate-400">
                        <User size={15} />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">To:</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono-custom">{selectedEmail.customer?.email}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(selectedEmail.status)}
                      <button
                        onClick={() => handleCopyText(selectedEmail.subject, 'subject')}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
                        title="Copy Subject"
                      >
                        {copiedSubject ? <Check size={14} className="text-accentEmerald" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedEmail.subject}
                    </h3>
                  </div>

                  {/* Quality Score Indicator Rings */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/30 dark:bg-[#0c0d14]/30 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Personalization</span>
                      <strong className="text-base font-extrabold text-accentPurple">{qualityScores.personalization}%</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tone Quality</span>
                      <strong className="text-base font-extrabold text-accentIndigo">{qualityScores.tone}%</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Conversion Chance</span>
                      <strong className="text-base font-extrabold text-accentEmerald">{qualityScores.conversionChance}%</strong>
                    </div>
                  </div>
                </div>

                {/* Editor vs HTML Preview Workspace */}
                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#090a0f]">
                  {/* Mode Toggler */}
                  <div className="px-5 py-2 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center space-x-1.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#121420] border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => setComposerMode('edit')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 ${composerMode === 'edit' ? 'bg-white dark:bg-[#0c0d14] text-accentPurple shadow-sm' : 'text-slate-500'}`}
                      >
                        <Edit3 size={11} />
                        <span>Edit Text</span>
                      </button>
                      <button
                        onClick={() => setComposerMode('preview')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 ${composerMode === 'preview' ? 'bg-white dark:bg-[#0c0d14] text-accentPurple shadow-sm' : 'text-slate-500'}`}
                      >
                        <Eye size={11} />
                        <span>Mock Preview</span>
                      </button>
                    </div>

                    {/* AI Rewrite Panel */}
                    <div className="flex items-center space-x-1.5">
                      <Wand2 size={13} className="text-accentPurple" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">AI Rewrite:</span>
                      {['Professional', 'Friendly', 'Short', 'High Conversion'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => handleAIRewrite(tone)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-[#121420] text-[9px] font-bold text-slate-650 dark:text-slate-450 border border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body Workspace */}
                  <div className="flex-1 p-5 overflow-y-auto">
                    {composerMode === 'edit' ? (
                      <textarea
                        value={selectedEmail.body}
                        onChange={(e) => setSelectedEmail(prev => ({ ...prev, body: e.target.value }))}
                        className="w-full h-full bg-transparent border-none text-sm leading-relaxed text-slate-705 dark:text-slate-300 placeholder-slate-500 focus:outline-none resize-none font-sans"
                      />
                    ) : (
                      /* Live HTML Mail Preview Mock */
                      <div className="max-w-md mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-350 text-xs shadow-sm font-sans space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                          <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase tracking-wider">Subject</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">{selectedEmail.subject}</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">
                          {selectedEmail.body}
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                          <button className="px-5 py-2.5 bg-accentPurple text-white font-bold rounded-xl shadow-md cursor-pointer hover:bg-accentViolet">
                            {selectedEmail.cta || 'Verify Discovery Call'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0c0d14] shrink-0">
                  {/* Left: Copy & AI Regenerate */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyText(selectedEmail.body, 'body')}
                      className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      {copiedBody ? <Check size={13} className="text-accentEmerald" /> : <Copy size={13} />}
                      <span>{copiedBody ? 'Copied Body!' : 'Copy Body'}</span>
                    </button>

                    <button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="flex items-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
                      <span>{regenerating ? 'Regenerating...' : 'Regenerate Draft'}</span>
                    </button>
                  </div>

                  {/* Right: Review Approval Toggles & Send */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleApprove}
                      disabled={selectedEmail.status === 'approved'}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                    >
                      <ThumbsUp size={13} />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={handleReject}
                      disabled={selectedEmail.status === 'rejected'}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      <ThumbsDown size={13} />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={handleSendOutreach}
                      disabled={sending || selectedEmail.status !== 'approved'}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-accentPurple to-accentIndigo text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100 transition-all"
                    >
                      {sending ? (
                        <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      ) : (
                        <>
                          <Send size={12} />
                          <span>Send Outreach</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-400">
                Select a draft to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
