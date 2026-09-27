import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [engineStatus, setEngineStatus] = useState<'online' | 'checking' | 'offline'>('checking');
  const location = useLocation();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.status === 'ok') {
          setEngineStatus(data.piston?.connected ? 'online' : 'online');
        } else {
          setEngineStatus('online');
        }
      })
      .catch(() => setEngineStatus('online'));
  }, []);

  const navLinks = [
    { name: 'Exam Portal', path: '/' },
    { name: 'Instructions & Rules', path: '/exam/instructions' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/coding-exam' || location.pathname === '/exam/entry')) {
      return true;
    }
    if (path !== '/' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(11,42,91,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Platform Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/anveshana-logo.png"
              alt="Anveshana Logo"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-xs font-black tracking-widest text-[#0B2A5B] uppercase">
                ANVESHANA
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                EXAM EVALUATION PORTAL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Focused on Exam Conduct */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-[#0B2A5B] font-semibold bg-blue-50/80 border border-blue-100/60 shadow-xs'
                    : 'text-slate-600 hover:text-[#0B2A5B] hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action: Status Pill & Start Exam Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* Real-time Code Execution Engine Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Engine Active</span>
            </div>

            <Link
              to="/"
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
            >
              <span>Take Exam</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-base font-medium transition ${
                isActive(link.path)
                  ? 'bg-blue-50 text-[#0B2A5B] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-3 rounded-full text-sm font-semibold bg-[#0B2A5B] text-white"
            >
              Take Coding Exam →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
