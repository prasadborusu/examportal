import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Loader2 } from 'lucide-react';

export const ExamPasskey: React.FC = () => {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Retrieve student details from session storage
  const fullName = sessionStorage.getItem('student_name');
  const rollNumber = sessionStorage.getItem('student_roll');
  const email = sessionStorage.getItem('student_email');

  useEffect(() => {
    if (!fullName || !rollNumber || !email) {
      navigate('/exam/entry');
      return;
    }
    // Auto focus first box
    inputRefs[0].current?.focus();
  }, [fullName, rollNumber, email, navigate]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1); // Take latest single digit
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next box if digit entered
    if (cleanVal && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
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

    // Focus on next empty box or the last box
    const nextIdx = Math.min(pasted.length, 3);
    inputRefs[nextIdx].current?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const passkey = digits.join('');
    if (passkey.length !== 4) {
      setError('Please enter all 4 digits of your exam passkey.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/exam/verify-passkey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          roll_number: rollNumber,
          email: email,
          passkey: passkey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to verify passkey.');
        setLoading(false);
        return;
      }

      // Store attempt info
      sessionStorage.setItem('current_attempt_id', data.attemptId);
      sessionStorage.setItem('current_exam_id', data.exam.id);
      sessionStorage.setItem('current_exam_title', data.exam.title);
      sessionStorage.setItem('current_exam_duration', String(data.exam.duration_minutes));
      sessionStorage.setItem('current_exam_marks', String(data.exam.total_marks));
      sessionStorage.setItem('current_exam_questions_count', String(data.exam.total_questions || ''));

      navigate('/exam/instructions');
    } catch (err: any) {
      setError('Could not connect to assessment server. Please ensure the backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-blue-100/30 via-amber-100/20 to-purple-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Centered Passkey Card (matches reference) */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_15px_35px_-5px_rgba(11,42,91,0.07)] p-8 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Top bar back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/exam/entry')}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 transition"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            STEP 2 OF 3
          </span>
        </div>

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
              Enter Exam Passkey
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Enter the 4-digit code provided by the exam coordinator.
            </p>
          </div>
        </div>

        {/* Student identification pill */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-slate-800 truncate max-w-[180px]">{fullName}</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[#0B2A5B] font-bold">
            {rollNumber}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Passkey Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center font-display text-2xl sm:text-3xl font-extrabold rounded-2xl border-2 border-slate-200 bg-slate-50/50 text-[#0B2A5B] focus:border-[#0B2A5B] focus:bg-white focus:outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          <div className="text-center text-xs text-slate-400">
            <span>Passkey format: 4 numeric digits provided by exam invigilator</span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Passkey...</span>
              </>
            ) : (
              <>
                <span>Enter Exam</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
