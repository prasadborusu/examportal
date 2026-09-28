import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Home,
} from 'lucide-react';
import { ExamResult } from '../types';

export const ExamResultView: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;

    fetch(`/api/exam/${attemptId}/result`)
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        setLoading(false);

        // Fire celebratory confetti if good score
        if (data.total_score >= 50) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0B2A5B', '#2563EB', '#F6B51B', '#10B981'],
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B2A5B]" />
        <p className="text-sm text-slate-500 font-medium">Calculating assessment scores...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Assessment Result Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested attempt has either not been finalized or could not be located on the server.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#0B2A5B] text-white"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const percentage = Math.round((result.total_score / (result.total_marks || 100)) * 100);

  return (
    <div className="py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ASSESSMENT COMPLETE</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#0F172A] tracking-tight">
          Performance Summary
        </h1>
        <p className="text-sm text-slate-500">
          Student: <strong className="text-slate-800">{result.student_name}</strong> • Roll: <strong className="text-slate-800 font-mono">{result.roll_number}</strong>
        </p>
      </div>

      {/* Main Score & Metrics Card */}
      <div className="card-soft p-8 sm:p-10 space-y-8 bg-white border border-slate-100 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              TOTAL SCORE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold text-[#0B2A5B] font-display">
                {result.total_score}
              </span>
              <span className="text-2xl text-slate-400 font-semibold">
                / {result.total_marks}
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold pt-1">
              Overall Accuracy: {percentage}%
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Taken</span>
              </div>
              <span className="text-base font-bold text-slate-800 font-mono">
                {formatSeconds(result.time_taken_seconds)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passed Cases</span>
              </div>
              <span className="text-base font-bold text-slate-800 font-mono">
                {result.passed_test_cases} / {result.total_test_cases}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Questions</span>
              </div>
              <span className="text-base font-bold text-slate-800">
                {result.questions_answered} / {result.total_questions}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Violations</span>
              </div>
              <span className={`text-base font-bold font-mono ${result.violations_count > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {result.violations_count}
              </span>
            </div>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Problem Breakdown
          </h3>
          <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            {result.breakdown && result.breakdown.length > 0 ? (
              result.breakdown.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900 block text-sm">
                      {idx + 1}. {item.question_title}
                    </span>
                    <span className="text-slate-400">
                      Test Cases Passed: {item.passed_cases} / {item.total_cases}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        item.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'Partial Score'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-mono w-16 text-right">
                      {item.score} / {item.max_marks}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400">
                Detailed breakdown unavailable
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-slate-600">
          <Award className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your results have been securely archived in the Central University database. The club technical board will review top submissions for hackathon invitations and merit awards.
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2 flex justify-center">
          <Link
            to="/"
            className="px-8 py-3 rounded-full text-sm font-semibold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
