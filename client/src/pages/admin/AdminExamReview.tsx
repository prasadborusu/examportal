import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Award,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
  Play,
  ArrowRight,
  Edit2,
  FileCode,
  Loader2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { Exam } from '../../types';

export const AdminExamReview: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [copiedPasskey, setCopiedPasskey] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  // Passkey Modal state
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [newPasskey, setNewPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySaving, setPasskeySaving] = useState(false);

  const fetchExamDetails = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const [examRes, questionsRes, sectionsRes] = await Promise.all([
        fetch(`/api/admin/exams/${examId}`),
        fetch(`/api/admin/exams/${examId}/questions`),
        fetch(`/api/admin/exams/${examId}/sections`),
      ]);

      if (examRes.ok) {
        setExam(await examRes.json());
      }
      if (questionsRes.ok) {
        const qList = await questionsRes.json();
        qList.sort((a: any, b: any) => a.order_number - b.order_number);
        setQuestions(qList);
      }
      if (sectionsRes.ok) {
        setSections(await sectionsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  // Marks Calculation
  const totalConfiguredMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  const examTotalMarks = exam?.total_marks || 100;
  const isMarksValid = totalConfiguredMarks === examTotalMarks;

  const isSectional = exam?.exam_type === 'SECTIONAL';
  const isMcqExam = exam?.exam_type === 'MCQ';
  const isCodingExam = exam?.exam_type === 'CODING';

  const mcqQuestions = questions.filter((q) => q.question_type === 'MCQ');
  const codingQuestions = questions.filter((q) => q.question_type !== 'MCQ');

  // Validation Checklist Items
  const checklist = [
    {
      title: 'Exam Title & Parameters Configured',
      passed: Boolean(exam?.title && exam?.title.trim().length > 0),
      fixLink: `/admin/exams`,
    },
    {
      title: 'Duration & Max Violations Set',
      passed: Boolean(exam && exam.duration_minutes > 0 && exam.max_violations > 0),
      fixLink: `/admin/exams`,
    },
    {
      title: '4-Digit Student Passkey Active',
      passed: Boolean(exam?.passkey && exam.passkey.length === 4),
      fixLink: `/admin/exams`,
    },
    ...(isSectional
      ? [
          {
            title: 'Assessment Sections Configured',
            passed: sections.length > 0,
            errorMsg: 'Sectional assessment requires at least 1 section.',
            fixLink: `/admin/exams/${examId}/questions`,
          },
          {
            title: 'Every Section Contains Questions',
            passed: sections.length > 0 && sections.every((s) => questions.some((q) => q.section_id === s.id)),
            errorMsg: 'One or more sections have no questions added.',
            fixLink: `/admin/exams/${examId}/questions`,
          },
        ]
      : [
          {
            title: 'Questions Added',
            passed:
              isMcqExam
                ? mcqQuestions.length > 0
                : isCodingExam
                ? codingQuestions.length > 0
                : questions.length > 0,
            errorMsg: isMcqExam
              ? 'No MCQ questions added yet.'
              : isCodingExam
              ? 'No coding problems added yet.'
              : 'No questions added yet. Add at least 1 question.',
            fixLink: `/admin/exams/${examId}/questions/new`,
          },
        ]),
    {
      title: 'Question Marks Match Exam Total',
      passed: isMarksValid,
      errorMsg:
        totalConfiguredMarks !== examTotalMarks
          ? `Configured marks (${totalConfiguredMarks}) must equal exam total marks (${examTotalMarks})`
          : undefined,
      fixLink: `/admin/exams/${examId}/questions`,
    },
    ...(mcqQuestions.length > 0
      ? [
          {
            title: 'MCQ Answer Keys Designated',
            passed: mcqQuestions.every(
              (q) => Array.isArray(q.options) && q.options.length >= 2 && Boolean(q.correct_option_id)
            ),
            errorMsg: 'One or more MCQs do not have at least 2 options or a marked correct answer.',
            fixLink: `/admin/exams/${examId}/questions`,
          },
        ]
      : []),
    ...(codingQuestions.length > 0
      ? [
          {
            title: 'Public Test Cases Configured',
            passed: codingQuestions.every((q) =>
              (q.test_cases || []).some((tc: any) => !tc.is_hidden && tc.type !== 'HIDDEN')
            ),
            errorMsg: 'One or more coding problems do not have public test cases for dry runs.',
            fixLink: `/admin/exams/${examId}/questions`,
          },
          {
            title: 'Hidden Evaluation Test Cases Configured',
            passed: codingQuestions.every((q) =>
              (q.test_cases || []).some((tc: any) => tc.is_hidden || tc.type === 'HIDDEN')
            ),
            errorMsg: 'One or more coding problems have no hidden test cases configured.',
            fixLink: `/admin/exams/${examId}/questions`,
          },
        ]
      : []),
  ];

  const allPassed = checklist.every((item) => item.passed);

  const handleActivate = async () => {
    if (!allPassed) {
      alert('Please resolve all validation errors before activating the exam.');
      return;
    }

    setActivating(true);
    setActivationError(null);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate assessment');
      }

      setIsActivateModalOpen(false);
      navigate(`/admin/exams/${examId}`);
    } catch (err: any) {
      setActivationError(err.message);
    } finally {
      setActivating(false);
    }
  };

  const handleCopyPasskey = () => {
    if (!exam?.passkey) return;
    navigator.clipboard.writeText(exam.passkey);
    setCopiedPasskey(true);
    setTimeout(() => setCopiedPasskey(false), 2000);
  };

  const openPasskeyModal = () => {
    setNewPasskey(exam?.passkey || '');
    setPasskeyError(null);
    setIsPasskeyModalOpen(true);
  };

  const handleGenerateRandomPasskey = () => {
    const generated = String(Math.floor(1000 + Math.random() * 9000));
    setNewPasskey(generated);
    setPasskeyError(null);
  };

  const handleSavePasskey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!examId) return;

    const cleanPasskey = newPasskey.trim();
    if (!/^\d{4}$/.test(cleanPasskey)) {
      setPasskeyError('Passkey must be exactly 4 numeric digits (e.g. 9126).');
      return;
    }

    try {
      setPasskeySaving(true);
      setPasskeyError(null);
      const res = await fetch(`/api/admin/exams/${examId}/passkey`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: cleanPasskey }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasskeyError(data.error || 'Failed to update passkey');
        return;
      }

      setExam((prev) => (prev ? { ...prev, passkey: cleanPasskey } : null));
      setIsPasskeyModalOpen(false);
    } catch (err: any) {
      setPasskeyError(err.message || 'Network error updating passkey');
    } finally {
      setPasskeySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-[#0B2A5B] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling assessment review...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/exams/${examId}/questions`)}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
            title="Back to Questions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                Review Assessment
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  exam?.status === 'LIVE' || exam?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {exam?.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {exam?.title} — Verify questions, marks, and test cases before publishing
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Duration */}
        <div className="card-soft p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {exam?.duration_minutes} min
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Questions */}
        <div className="card-soft p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {questions.length} Problems
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Total Marks */}
        <div className="card-soft p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Marks</span>
            <span
              className={`text-base font-extrabold mt-0.5 block ${
                isMarksValid ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalConfiguredMarks} / {examTotalMarks}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* Passkey */}
        <div className="card-soft p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passkey</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-base font-extrabold text-slate-900">
                {exam?.passkey}
              </span>
              <button
                type="button"
                onClick={handleCopyPasskey}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy Passkey"
              >
                {copiedPasskey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={openPasskeyModal}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B2A5B] bg-amber-50 hover:bg-amber-100 border border-amber-200/60 px-2 py-0.5 rounded-lg transition ml-1"
                title="Change Passkey"
              >
                <Edit2 className="w-3 h-3 text-[#0B2A5B]" />
                <span>Change</span>
              </button>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="card-soft p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-[#0B2A5B]" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Assessment Readiness Checklist
          </h3>
        </div>

        <div className="space-y-2.5 text-xs">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-between p-3 rounded-xl border transition ${
                item.passed
                  ? 'bg-emerald-50/40 border-emerald-100 text-slate-800'
                  : 'bg-rose-50/50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">{item.title}</span>
                  {item.errorMsg && !item.passed && (
                    <span className="text-[11px] text-rose-600 block mt-0.5">
                      {item.errorMsg}
                    </span>
                  )}
                </div>
              </div>

              {!item.passed && item.fixLink && (
                <Link
                  to={item.fixLink}
                  className="text-xs font-bold text-rose-700 hover:underline shrink-0 flex items-center gap-1"
                >
                  <span>Fix Issue</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Questions Preview List */}
      <div className="card-soft p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[#0B2A5B]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Configured Problems ({questions.length})
            </h3>
          </div>
          <Link
            to={`/admin/exams/${examId}/questions`}
            className="text-xs font-semibold text-[#2563EB] hover:text-[#0B2A5B] flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Questions</span>
          </Link>
        </div>

        {questions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No questions configured yet. Click "Edit Questions" to add problem statements.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const testCases = q.test_cases || [];
              const hiddenCases = testCases.filter((tc: any) => tc.is_hidden || tc.type === 'HIDDEN');
              const publicCases = testCases.length - hiddenCases.length;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{q.title}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          q.difficulty === 'Easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.difficulty === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] line-clamp-1 max-w-lg">
                      {q.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-slate-600">
                    <span className="font-bold text-slate-900">{q.marks} Marks</span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {testCases.length} Test Cases ({hiddenCases.length} Hidden)
                    </span>
                    <Link
                      to={`/admin/exams/${examId}/questions/${q.id}/edit`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#0B2A5B] hover:bg-slate-100"
                      title="Edit Problem"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/admin/exams/${examId}/questions`)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Edit Questions</span>
          </button>

          <button
            type="button"
            disabled={!allPassed}
            onClick={() => setIsActivateModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Activate Exam →</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Activate Assessment */}
      {isActivateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Play className="w-6 h-6 fill-emerald-600 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-display">
                Activate Assessment?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to activate <strong>"{exam?.title}"</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Students can enter using 4-digit passkey: <strong className="font-mono text-slate-800">{exam?.passkey}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>All {questions.length} coding problems will become accessible.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Hidden test cases will be evaluated automatically by Piston.</span>
                </div>
              </div>
            </div>

            {activationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {activationError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={activating}
                onClick={handleActivate}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0B2A5B] hover:bg-[#123773] text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {activating ? 'Activating...' : 'Activate Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Change Passkey Modal */}
      {isPasskeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-md w-full space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Change Exam Passkey
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {exam?.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasskeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePasskey} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    4-Digit Passkey
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPasskey}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    value={newPasskey}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewPasskey(val);
                      if (passkeyError) setPasskeyError(null);
                    }}
                    placeholder="e.g. 9126"
                    className="w-full text-center tracking-[0.5em] font-mono font-extrabold text-2xl py-3 px-4 rounded-xl border border-slate-300 focus:border-[#0B2A5B] focus:ring-2 focus:ring-blue-100 outline-none transition bg-slate-50 focus:bg-white text-slate-900"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Enter 4 numeric digits candidates will use to unlock this assessment
                </p>
              </div>

              {passkeyError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{passkeyError}</span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs space-y-1 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Current Passkey: <strong className="font-mono text-slate-900">{exam?.passkey || 'None'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Takes effect immediately for all students entering this assessment.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasskeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passkeySaving || newPasskey.trim().length !== 4}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#123773] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  {passkeySaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Passkey</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
