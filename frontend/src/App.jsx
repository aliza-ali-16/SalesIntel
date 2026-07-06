import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Restructured Modular Layout Components
import ProtectedRoute from './components/layouts/ProtectedRoute';
import Sidebar from './components/layouts/Sidebar';
import Header from './components/layouts/Header';
import CommandPalette from './components/layouts/CommandPalette';
import AssistantChat from './components/chatbot/AssistantChat';

// Upgraded & New Platform Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CRMUpload from './pages/CRMUpload';
import Leads from './pages/Leads';
import FollowUps from './pages/FollowUps';
import Emails from './pages/Emails';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';

// Inner Layout wrapper for protected routes
function DashboardLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Find page title from path
  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Sales Intelligence Dashboard';
      case '/analytics': return 'Performance & Analytics';
      case '/upload': return 'CRM Upload Center';
      case '/leads': return 'Lead Map Priorities';
      case '/approvals': return 'Human-in-the-Loop Approvals';
      case '/followups': return 'Follow-up Timeline';
      case '/emails': return 'Personalized Email Center';
      case '/agents': 
      case '/monitoring': return 'AI Agent Control Center';
      case '/settings': return 'System Settings';
      default: return 'Sales Intelligence Platform';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#08090d]">
      {/* Global Command Palette (CTRL + K) overlay */}
      <CommandPalette />

      {/* Global Floating AI Sales Assistant */}
      <AssistantChat />

      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main content container */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header setIsMobileOpen={setIsMobileOpen} pageTitle={getPageTitle(location.pathname)} />

        {/* Dynamic page view */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/upload" element={<CRMUpload />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/monitoring" element={<Navigate to="/agents" replace />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Secure Dashboard Views */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
