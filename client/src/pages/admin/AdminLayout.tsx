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
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { BACKEND_URL } from '../../api/config';
import { AdminPinLock } from './AdminPinLock';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

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
      const res = await fetch(`${BACKEND_URL}/api/health`);
      const data = await res.json();
      if (data && data.status === 'ok') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (e) {
      try {
        const retryRes = await fetch(`${BACKEND_URL}/api/health`);
        const retryData = await retryRes.json();
        if (retryData && retryData.status === 'ok') {
          setBackendStatus('connected');
          return;
        }
      } catch (err) {}
      setBackendStatus('disconnected');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLock = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_time');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminPinLock onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen flex bg-[#FAFBFF] overflow-hidden">
      {/* --------------------------------------------------- */}
      {/* LEFT SIDEBAR */}
      {/* --------------------------------------------------- */}
      <aside className="w-64 bg-[#0B2A5B] flex flex-col shrink-0 text-white shadow-xl z-20">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-base text-blue-200">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ANVESHANA</h1>
            <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-semibold">
              Admin Assessment Panel
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
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

          {/* Backend Connection Indicator */}
          <div className="px-2 py-1.5 flex items-center gap-2 text-[10px]">
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
                ? 'Connecting...'
                : 'Render Disconnected'}
            </span>
          </div>
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
            {backendStatus === 'connected' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backend Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Connecting to Render...</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <div className="w-6 h-6 rounded-full bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-[10px]">
                AD
              </div>
              <span className="font-semibold">Coordinator</span>
            </div>

            <button
              onClick={handleLock}
              title="Lock Admin Portal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
