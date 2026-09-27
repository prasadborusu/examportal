import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Hash, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const ExamEntry: React.FC = () => {
  const navigate = useNavigate();

  // Fresh, empty form fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Clear any residual session data so form always starts completely clean
  useEffect(() => {
    sessionStorage.removeItem('student_name');
    sessionStorage.removeItem('student_roll');
    sessionStorage.removeItem('student_email');
    sessionStorage.removeItem('exam_id');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !rollNumber.trim() || !email.trim()) {
      setError('Please fill in all details before continuing.');
      return;
    }

    sessionStorage.setItem('student_name', fullName.trim());
    sessionStorage.setItem('student_roll', rollNumber.trim().toUpperCase());
    sessionStorage.setItem('student_email', email.trim().toLowerCase());

    navigate('/exam/passkey');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-100/30 via-amber-100/20 to-purple-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Centered Entry Card (matches reference) */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_15px_35px_-5px_rgba(11,42,91,0.07)] p-8 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Soft top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0B2A5B] via-[#2563EB] to-[#F6B51B]" />

        {/* Logo and Titles */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <img
              src="/anveshana-logo.png"
              alt="Anveshana Logo"
              className="h-12 w-auto mx-auto object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Join the Coding Assessment
            </h2>
            <p className="text-xs text-slate-500">
              Enter your details to get started. No password required.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Entry Form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B] bg-slate-50/40 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Roll Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. 23A91A05"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm uppercase focus:outline-none focus:border-[#0B2A5B] bg-slate-50/40 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B] bg-slate-50/40 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Security Assurance */}
        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Central University Assessment Infrastructure</span>
        </div>
      </div>
    </div>
  );
};
