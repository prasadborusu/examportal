import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Unlock, ArrowRight, Eye, EyeOff, Delete } from 'lucide-react';
import { BACKEND_URL } from '../../api/config';

interface AdminPinLockProps {
  onSuccess: () => void;
}

const ADMIN_CORRECT_PIN = '8520';

export const AdminPinLock: React.FC<AdminPinLockProps> = ({ onSuccess }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // If multiple digits pasted or typed rapidly
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 4).split('');
      const newDigits = [...digits];
      for (let i = 0; i < chars.length && (index + i) < 4; i++) {
        newDigits[index + i] = chars[i];
      }
      setDigits(newDigits);
      setError(null);
      const fullPin = newDigits.join('');
      if (fullPin.length === 4) {
        verifyPin(fullPin);
      } else {
        const nextIdx = Math.min(index + chars.length, 3);
        inputRefs[nextIdx].current?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1);
    setDigits(newDigits);
    setError(null);

    // If a digit was entered, auto-advance
    if (cleanVal && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto verify when all 4 digits are filled
    const fullPin = newDigits.join('');
    if (fullPin.length === 4) {
      verifyPin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      verifyPin(digits.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 4) {
      verifyPin(pasted);
    } else {
      const nextIdx = Math.min(pasted.length, 3);
      inputRefs[nextIdx].current?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (loading || isSuccess) return;

    if (val === 'backspace') {
      // Find last filled index
      const lastFilled = digits.map((d) => d !== '').lastIndexOf(true);
      if (lastFilled !== -1) {
        const newDigits = [...digits];
        newDigits[lastFilled] = '';
        setDigits(newDigits);
        inputRefs[lastFilled].current?.focus();
      }
      return;
    }

    if (val === 'clear') {
      setDigits(['', '', '', '']);
      setError(null);
      inputRefs[0].current?.focus();
      return;
    }

    // Fill first empty slot
    const firstEmpty = digits.findIndex((d) => d === '');
    if (firstEmpty !== -1) {
      const newDigits = [...digits];
      newDigits[firstEmpty] = val;
      setDigits(newDigits);
      setError(null);

      if (firstEmpty < 3) {
        inputRefs[firstEmpty + 1].current?.focus();
      } else {
        // Last digit filled
        verifyPin(newDigits.join(''));
      }
    }
  };

  const verifyPin = async (pin: string) => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit password.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    // Validate 8520
    if (pin === ADMIN_CORRECT_PIN) {
      setIsSuccess(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_auth_time', Date.now().toString());

      // Attempt background backend ping
      try {
        fetch(`${BACKEND_URL}/api/admin/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        }).catch(() => {});
      } catch (e) {}

      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 500);
      return;
    }

    // Incorrect password
    setTimeout(() => {
      setLoading(false);
      setError('Incorrect 4-digit password. Access denied.');
      triggerShake();
      setDigits(['', '', '', '']);
      inputRefs[0].current?.focus();
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(digits.join(''));
  };

  return (
    <div className="min-h-screen w-full bg-[#071329] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Security Card */}
      <div
        className={`w-full max-w-md bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative transition-transform duration-300 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              isSuccess
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 scale-105'
                : 'bg-blue-600/20 border-blue-400/30 text-blue-300'
            }`}
          >
            {isSuccess ? (
              <Unlock className="w-8 h-8 animate-bounce" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-[10px] font-semibold text-blue-300 uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3" />
              <span>Admin Access Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Enter Admin Password
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              This area is restricted. Enter your 4-digit authorization PIN to open the admin panel.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium flex items-center justify-center gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 4-Digit Box Input */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={digit}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={loading || isSuccess}
                autoComplete="off"
                className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl sm:text-3xl font-bold rounded-2xl border-2 transition-all outline-none ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : error
                    ? 'border-rose-500/80 bg-rose-500/10 text-white'
                    : digit
                    ? 'border-blue-400 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'border-white/10 bg-white/5 text-white focus:border-blue-400 focus:bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Visibility toggle & Hint */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="flex items-center gap-1.5 hover:text-slate-200 transition text-[11px] cursor-pointer"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
            </button>
            <span className="text-[11px] text-slate-400">4-digit PIN required</span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className={`w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/25 active:scale-[0.98]'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Access Granted...</span>
              </>
            ) : loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Admin Page</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* On-Screen Touch Keypad */}
        <div className="pt-2 border-t border-white/10">
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                disabled={loading || isSuccess}
                className="h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:bg-blue-600/30 border border-white/5 text-base font-semibold text-slate-200 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress('clear')}
              disabled={loading || isSuccess}
              className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              disabled={loading || isSuccess}
              className="h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:bg-blue-600/30 border border-white/5 text-base font-semibold text-slate-200 hover:text-white transition flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('backspace')}
              disabled={loading || isSuccess}
              className="h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-400 hover:text-slate-200 transition flex items-center justify-center cursor-pointer"
              title="Backspace"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Link back to public student exam portal */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-blue-300 transition underline underline-offset-4"
          >
            Return to Student Examination Portal
          </a>
        </div>
      </div>
    </div>
  );
};
