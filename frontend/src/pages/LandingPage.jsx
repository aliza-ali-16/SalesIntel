import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Bot, 
  TrendingUp, 
  Mail, 
  Database, 
  Terminal, 
  CheckCircle,
  Activity,
  Layers,
  CalendarCheck,
  X
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Automated CRM Upload',
      description: 'Upload your standard customer CSV contacts and let our validator sanitize and compile profiles instantly.',
      icon: Database,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'AI Lead Scoring',
      description: 'Our scoring agent evaluates page visits, email opens, and historical purchases to categorize leads into Hot, Warm, or Cold tiers.',
      icon: TrendingUp,
      color: 'from-purple-500 to-violet-500'
    },
    {
      title: 'Scheduled Follow-ups',
      description: 'The Follow-up agent designs outreach calendars, scheduling calls and follow-ups relative to lead temperature.',
      icon: CalendarCheck,
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Personalized Outreach Copilot',
      description: 'Email agents write customized outreach subject lines and body copies leveraging Gemini model templates.',
      icon: Mail,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  const agentSteps = [
    { number: '01', name: 'Manager Agent', desc: 'Main controller receiving data and orchestrating pipelines.' },
    { number: '02', name: 'CRM Analyzer', desc: 'Cleans, deduplicates, and structures customer datasets.' },
    { number: '03', name: 'Lead Scorer', desc: 'Applies normalized scoring models to separate priority leads.' },
    { number: '04', name: 'Follow-up Scheduler', desc: 'Maps optimal task completion timelines.' },
    { number: '05', name: 'Email Generator', desc: 'Crafts personalized communications powered by LLMs.' }
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 selection:bg-accentPurple selection:text-white font-sans overflow-x-hidden">
      {/* Navigation header */}
      <nav className="w-full h-20 border-b border-slate-900 bg-[#08090d]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-accentPurple to-accentIndigo text-white font-bold text-lg">
            Ω
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Sales<span className="text-accentPurple font-medium">Intel</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors duration-200">
            Sign In
          </Link>
          <Link to="/register" className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-accentPurple to-accentIndigo hover:from-accentViolet hover:to-accentPurple text-white rounded-xl shadow-md transition-all duration-200">
            <span>Get Started</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 mx-auto max-w-7xl text-center md:py-32">
        {/* Glow gradients backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accentPurple/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-accentIndigo/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 mb-6 rounded-full border border-accentPurple/30 bg-accentPurple/5 text-accentPurple text-xs font-semibold tracking-wide">
          <Bot size={13} className="animate-bounce" />
          <span>AUTONOMOUS MULTI-AGENT CRM SYSTEM</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-none">
          Automate Sales Intelligence With <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentPurple via-violet-400 to-accentIndigo">
            Autonomous AI Agents
          </span>
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-base text-slate-400 md:text-lg">
          Upload CRM lists. Watch five independent AI agents clean data, score lead interactions, configure outreach calendars, and draft personalized emails in real-time.
        </p>

        <div className="flex flex-col items-center justify-center space-y-3 mt-10 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Link to="/register" className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-accentPurple to-accentIndigo hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl shadow-lg shadow-accentPurple/20 transition-all duration-200">
            <span>Launch Free Pilot</span>
            <ArrowRight size={18} />
          </Link>
          <a href="#workflow" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 text-base font-bold bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition-all duration-200">
            Explore System Pipeline
          </a>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-16 border border-slate-800 bg-[#0e101a]/80 backdrop-blur-md rounded-2xl p-2 shadow-2xl relative">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090d] to-transparent pointer-events-none rounded-b-2xl"></div>
          <div className="flex items-center space-x-1.5 px-4 py-3 border-b border-slate-900 text-slate-600">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            <span className="text-xs ml-4 text-slate-500 font-mono-custom">https://app.salesintel.ai/dashboard</span>
          </div>
          <div className="h-64 md:h-[400px] flex items-center justify-center bg-[#0a0c14]/40 font-mono-custom text-xs text-slate-500">
            <div className="space-y-2 text-left p-6 w-full max-w-lg">
              <p className="text-purple-400">[MANAGER] Invoking CRM Analyzer Agent...</p>
              <p className="text-blue-400">[ANALYZER] Cleaned dataset. 1,024 records parsed. 12 duplicates resolved.</p>
              <p className="text-indigo-400">[SCORER] Normalized lead scores generated. HOT: 341, WARM: 489.</p>
              <p className="text-pink-400">[FOLLOW-UP] Priority outreach dates structured for immediate contact.</p>
              <p className="text-emerald-400">[EMAIL COGNITION] Email Agent generating personalized templates...</p>
              <p className="text-slate-400">[MCP MEMORY] Committing context logs to MCP state registries...</p>
              <p className="text-green-400 font-bold">✓ Multi-Agent pipeline execution finished. System standing by.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="px-6 py-20 border-t border-slate-950 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              Built For Smart Revenue Teams
            </h2>
            <p className="mt-4 text-slate-400">
              Eliminate administrative friction. Let specialized agents coordinate your pipelines.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="border border-slate-900 bg-[#0e101a]/70 rounded-2xl p-6 glow-card">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${f.color} flex items-center justify-center text-white mb-6 shadow-md`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Agent Pipeline Graph */}
      <section id="workflow" className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
            Multi-Agent Orchestration Flow
          </h2>
          <p className="mt-4 text-slate-400">
            How our independent agents communicate to synthesize complex sales profiles.
          </p>
        </div>

        {/* Pipeline container */}
        <div className="grid gap-6 md:grid-cols-5 relative">
          {/* Connecting arrow line on desktop */}
          <div className="hidden absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-accentPurple/20 via-accentIndigo/20 to-accentEmerald/20 md:block z-0"></div>

          {agentSteps.map((step, idx) => (
            <div key={idx} className="relative z-10 border border-slate-900 bg-[#0c0d14] rounded-2xl p-6 text-center shadow-lg hover:border-accentPurple/30 transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-[#161826] border border-slate-800 flex items-center justify-center text-accentPurple font-bold mx-auto mb-4 text-sm">
                {step.number}
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{step.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-20 border-t border-slate-950 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
              SaaS Pricing Options
            </h2>
            <p className="mt-4 text-slate-400">
              Select the plan that matches your pipeline scale. Cancel anytime.
            </p>
          </div>

          <div className="grid gap-8 max-w-4xl mx-auto md:grid-cols-2">
            {/* Standard Pilot */}
            <div className="border border-slate-900 bg-[#0e101a]/70 rounded-3xl p-8 relative flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">STARTER</span>
                <h3 className="text-2xl font-bold text-white mt-1">Free Pilot</h3>
                <p className="text-sm text-slate-400 mt-2">Perfect to experience multi-agent analysis.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-slate-500 text-sm"> / forever</span>
                </div>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Up to 1,000 CRM Customer records</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Lead Scoring & Segmentation</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Local Database fallback storage</span>
                  </li>
                  <li className="flex items-center space-x-2.5 text-slate-500">
                    <X size={16} className="text-red-500/60" />
                    <span>Direct Gemini API connection</span>
                  </li>
                </ul>
              </div>
              <Link to="/register" className="block w-full py-3 mt-8 text-center text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-200">
                Register Free Account
              </Link>
            </div>

            {/* Scale Pro */}
            <div className="border-2 border-accentPurple bg-[#0e101a]/90 rounded-3xl p-8 relative flex flex-col justify-between shadow-xl shadow-accentPurple/10">
              <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-accentPurple text-white text-xs font-bold uppercase tracking-wider">
                POPULAR
              </div>
              <div>
                <span className="text-xs font-bold text-accentPurple uppercase tracking-widest">GROWTH</span>
                <h3 className="text-2xl font-bold text-white mt-1">Enterprise Pro</h3>
                <p className="text-sm text-slate-400 mt-2">Unlimited execution runs and custom models.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white">$49</span>
                  <span className="text-slate-500 text-sm"> / month</span>
                </div>
                <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Unlimited CRM records upload</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Direct Gemini model API integration</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>Autonomous scheduler custom triggers</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle size={16} className="text-accentEmerald" />
                    <span>24/7 Agent pipeline monitoring</span>
                  </li>
                </ul>
              </div>
              <Link to="/register" className="block w-full py-3 mt-8 text-center text-sm font-bold bg-gradient-to-r from-accentPurple to-accentIndigo text-white rounded-xl shadow-md transition-all duration-200">
                Unlock Pro Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-xs text-slate-500 max-w-7xl mx-auto px-6">
        <p>© 2026 SalesIntel Multi-Agent SaaS. All rights reserved.</p>
        <p className="mt-2 text-slate-600">Built as an intelligent CRM helper utilizing ADK agent pipelines.</p>
      </footer>
    </div>
  );
}
