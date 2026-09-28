import React from 'react';
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
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-sm'
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
          <div className="flex items-center gap-2 px-2 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Piston Compiler Connected</span>
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 transition">
              <div className="w-6 h-6 rounded-full bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-[10px]">
                AD
              </div>
              <span className="font-semibold">Coordinator</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
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
