import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  Code,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Maximize2,
  Copy,
  Terminal,
  User,
  Hash,
  EyeOff,
  Flame,
} from 'lucide-react';

export const ExamInstructions: React.FC = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const attemptId = sessionStorage.getItem('current_attempt_id');
  const studentName = sessionStorage.getItem('student_name');
  const studentRoll = sessionStorage.getItem('student_roll');
  const examTitle = sessionStorage.getItem('current_exam_title') || 'Anveshana DSA Challenge';
  const duration = sessionStorage.getItem('current_exam_duration') || '60';
  const totalMarks = sessionStorage.getItem('current_exam_marks') || '100';
  const questionCount = sessionStorage.getItem('current_exam_questions_count') || '5';

  const handleStartExam = async () => {
    if (!agreed) return;

    if (!attemptId) {
      navigate('/');
      return;
    }

    // Request fullscreen on user gesture
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request bypassed or denied:', e);
    }

    navigate(`/exam/${attemptId}`);
  };

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(attemptId ? '/exam/passkey' : '/')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 transition shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-[#0B2A5B] tracking-wider uppercase mb-1">
              <ShieldAlert className="w-3 h-3 text-[#2563EB]" />
              <span>Official Assessment Guidelines</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Instructions & Anti-Malpractice Rules
            </h1>
          </div>
        </div>

        {/* Candidate Badge if verified */}
        {studentName && studentRoll ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-xs">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left text-xs">
              <span className="font-bold text-slate-800 block truncate max-w-[130px]">{studentName}</span>
              <span className="font-mono text-[10px] text-slate-500 uppercase">{studentRoll}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Exam Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-soft p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Duration</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{duration} Minutes</span>
          </div>
        </div>

        <div className="card-soft p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Questions</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{questionCount} Problems</span>
          </div>
        </div>

        <div className="card-soft p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Runtimes</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">Java, C++, Py, C</span>
          </div>
        </div>

        <div className="card-soft p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">Maximum Score</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{totalMarks} Marks</span>
          </div>
        </div>
      </div>

      {/* Critical Rules Sections */}
      <div className="space-y-5">
        {/* Section 1: STRICT ANTI-MALPRACTICE (Highlighting user requirements) */}
        <div className="rounded-3xl border border-rose-200/80 bg-rose-50/40 p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="uppercase tracking-wider">Critical Anti-Cheat Policies (Zero Tolerance)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Rule 1: No Tab Switching */}
            <div className="bg-white/95 rounded-2xl p-4 border border-rose-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold text-xs">
                🚫
              </div>
              <h4 className="text-sm font-bold text-slate-900">Tab Switching Strictly Prohibited</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Leaving the exam tab, opening another browser window, or minimizing the window triggers an automated security violation flag. <strong>Reaching 3 violations leads to immediate disqualification.</strong>
              </p>
            </div>

            {/* Rule 2: No Copy Paste */}
            <div className="bg-white/95 rounded-2xl p-4 border border-rose-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold text-xs">
                🔒
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Copy / Paste (Clipboard Locked)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Copying problem statements or pasting external code (<kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">Ctrl+C</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">Ctrl+V</kbd>) is disabled. All code must be typed directly inside the editor.
              </p>
            </div>

            {/* Rule 3: No Malpractice */}
            <div className="bg-white/95 rounded-2xl p-4 border border-rose-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold text-xs">
                🛡️
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Malpractice & External Aids</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use of secondary devices, phones, ChatGPT/LLMs, browser extensions, or proxy candidates is tracked. Submissions are screened with automated similarity analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Fullscreen & Browser Security */}
        <div className="card-soft p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5 text-[#0B2A5B] font-bold text-sm">
            <Maximize2 className="w-4 h-4 text-[#2563EB]" />
            <span className="uppercase tracking-wider">Browser & Interface Lockdown Rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Forced Fullscreen Mode:</strong> The assessment operates in exclusive fullscreen. Exiting fullscreen triggers an immediate proctor alert.</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Developer Tools & Shortcuts Blocked:</strong> Right-click inspect element, <kbd className="px-1 py-0.5 rounded bg-white border text-[10px] font-mono">F12</kbd>, and <kbd className="px-1 py-0.5 rounded bg-white border text-[10px] font-mono">Ctrl+Shift+I</kbd> are intercepted.</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Do Not Refresh the Page:</strong> Refreshing (<kbd className="px-1 py-0.5 rounded bg-white border text-[10px] font-mono">F5</kbd>) interrupts your session. All code is auto-saved continuously on the server.</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <span><strong>Live Security Telemetry:</strong> Every blur, tab switch, and clipboard attempt is timestamped and relayed to the admin monitoring room.</span>
            </div>
          </div>
        </div>

        {/* Section 3: Code Execution & Grading */}
        <div className="card-soft p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span className="uppercase tracking-wider">Code Execution & Scoring Environment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-600">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Standard I/O Convention:</strong> Read input from stdin (<code className="text-[#0B2A5B] font-mono">Scanner</code>/ <code className="text-[#0B2A5B] font-mono">cin</code>/ <code className="text-[#0B2A5B] font-mono">sys.stdin</code>) and output to stdout.</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>3-Second Execution Limit:</strong> Code execution is capped at 3000ms. Avoid unbounded recursion or infinite loops to prevent Time Limit Exceeded (TLE).</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Hidden Test Cases:</strong> Submissions are evaluated against both public sample test cases and hidden evaluation benchmarks.</span>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Automatic Final Submission:</strong> When the 60-minute countdown expires, your latest code for all 5 problems will be automatically graded and finalized.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Agreement & Start Action */}
      <div className="card-soft p-6 sm:p-8 space-y-6 bg-gradient-to-b from-white to-slate-50/60 border border-slate-200">
        <label className="flex items-start gap-3.5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-[#0B2A5B] focus:ring-[#0B2A5B] w-4 h-4 shrink-0 cursor-pointer"
          />
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              I agree to the Examination Code of Conduct & Anti-Malpractice Rules
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              I certify that I will not switch tabs, attempt to copy/paste, or engage in any malpractice. I understand that any violation will be automatically reported and will result in immediate disqualification.
            </p>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted Session • Automated Sandbox Evaluation</span>
          </div>

          {attemptId ? (
            <button
              onClick={handleStartExam}
              disabled={!agreed}
              className="w-full sm:w-auto py-3 px-8 rounded-full text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Launch Secure Exam</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto py-3 px-8 rounded-full text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Enter Exam Portal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
