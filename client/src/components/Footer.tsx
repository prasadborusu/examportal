import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Terminal, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-slate-100">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-block">
              <img
                src="/anveshana-logo.png"
                alt="Anveshana Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-xs font-bold tracking-widest text-[#0B2A5B] uppercase">
              ANVESHANA CODING ASSESSMENT PLATFORM
            </p>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Automated high-concurrency coding examination portal featuring isolated sandbox execution (Java, C++, Python, C), automated test case validation, and real-time proctoring security.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Isolated Execution Sandbox Active (Local Piston Port 2000)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Exam Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-600 hover:text-[#0B2A5B] transition flex items-center gap-1 font-semibold text-[#2563EB]">
                  Enter Exam Portal <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/exam/instructions" className="text-slate-600 hover:text-[#0B2A5B] transition">
                  Exam Guidelines & System Check
                </Link>
              </li>
              <li>
                <Link to="/exam/passkey" className="text-slate-600 hover:text-[#0B2A5B] transition">
                  Passkey Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrity & Proctoring */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Integrity & Proctoring
            </h4>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Tab-switch, clipboard and window blur monitoring enabled.</span>
              </div>
              <div className="flex items-start gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>Execution restricted to standard I/O with strict 3-sec CPU limits.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Anveshana. Central University Club Exam System.</p>
          <div className="flex items-center gap-6">
            <span>Assessment Code of Conduct</span>
            <span>Academic Integrity Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
