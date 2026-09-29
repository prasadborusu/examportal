import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCode,
  HelpCircle,
  Users,
  Send,
  Award,
  Radio,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronDown,
  User,
  ExternalLink,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [apiUrlInput, setApiUrlInput] = useState<string>(() => localStorage.getItem('ANVESHANA_API_URL') || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Exams', path: '/admin/exams', icon: FileCode },
    { name: 'Questions', path: '/admin/questions', icon: HelpCircle },
    { name: 'Participants', path: '/admin/participants', icon: Users },
    { name: 'Submissions', path: '/admin/submissions', icon: Send },
    { name: 'Results', path: '/admin/results', icon: Award },
    { name: 'Live Monitor', path: '/admin/live', icon: Radio },
    { name: 'Security Logs', path: '/admin/security', icon: ShieldAlert },
  ];

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setBackendStatus('disconnected');
        return;
      }
      const data = await res.json();
      if (data && data.status === 'ok') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (e) {
      setBackendStatus('disconnected');
    }
  };

  useEffect(() => {
    checkHealth();
  }, [location.pathname]);

  const handleSaveApiUrl = async () => {
    setIsSaving(true);
    const cleaned = apiUrlInput.trim().replace(/\/+$/, '');
    if (cleaned) {
      localStorage.setItem('ANVESHANA_API_URL', cleaned);
    } else {
      localStorage.removeItem('ANVESHANA_API_URL');
    }
    await checkHealth();
    setIsSaving(false);
    setShowApiModal(false);
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen flex bg-[#FAFBFF] overflow-hidden">
      {/* --------------------------------------------------- */}
      {/* LEFT SIDEBAR (Dark Navy matching reference admin) */}
      {/* --------------------------------------------------- */}
      <aside className="w-64 bg-[#0A1A36] text-white flex flex-col shrink-0">
        {/* Brand header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center font-bold text-white font-display text-lg">
            A
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-white uppercase">
              ANVESHANA
            </div>
            <div className="text-[10px] text-blue-200/60 font-semibold tracking-wider uppercase">
              Admin Assessment Panel
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <span>Public Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Real Backend Connection Indicator */}
          <button
            onClick={() => setShowApiModal(true)}
            className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer"
            title="Click to view or change backend API connection settings"
          >
            <div className="flex items-center gap-2 text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
              />
              <span className={backendStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {backendStatus === 'connected'
                  ? 'Backend Active'
                  : backendStatus === 'checking'
                  ? 'Checking API...'
                  : 'Backend Disconnected'}
              </span>
            </div>
            <Settings className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </aside>

      {/* --------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* --------------------------------------------------- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-slate-400">Admin Portal / </span>
            <span className="text-xs font-semibold text-slate-700 capitalize">
              {location.pathname.replace('/admin', '').replace('/', '') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* If Backend Disconnected Warning Pill */}
            {backendStatus === 'disconnected' && (
              <button
                onClick={() => setShowApiModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Connect Render Backend</span>
              </button>
            )}

            {backendStatus === 'connected' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>API Connected</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className="w-6 h-6 rounded-full bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-[10px]">
                AD
              </div>
              <span className="font-semibold">Coordinator</span>
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>

      {/* Backend API Connection Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 space-y-4 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowApiModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Backend API Connection</h3>
                <p className="text-xs text-slate-500">Connect this frontend to your Render backend</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Render Backend Service URL
              </label>
              <input
                type="url"
                placeholder="https://anveshana-backend.onrender.com"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-mono bg-slate-50/60"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Paste your live Render Web Service URL. Saving here applies immediately in your browser without requiring a Vercel redeploy.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveApiUrl}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-blue-900 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save & Test Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
