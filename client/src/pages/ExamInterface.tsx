import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Clock,
  Play,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RotateCcw,
  AlignLeft,
  AlertTriangle,
  LogOut,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Code2,
  Check,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  FileCode,
  Terminal,
  Lock,
  Copy,
} from 'lucide-react';
import { Question, Submission, SubmissionStatus } from '../types';

export const ExamInterface: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // Exam and session state
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Editor and language state
  const [selectedLanguage, setSelectedLanguage] = useState<'java' | 'cpp' | 'python' | 'c'>('java');
  const [codePerQuestion, setCodePerQuestion] = useState<Record<string, Record<string, string>>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [submissionsByQuestion, setSubmissionsByQuestion] = useState<Record<string, Submission>>({});

  // Execution state
  const [customInput, setCustomInput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'results' | 'output' | 'input' | 'errors'>('results');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string>('Ready. Click "Run Code" to test against public test cases or custom input.');
  const [executionErrors, setExecutionErrors] = useState<string>('');
  const [executionDetails, setExecutionDetails] = useState<{
    timeMs?: number;
    memoryMb?: number;
    exitCode?: number;
    statusBadge?: string;
    isSuccess?: boolean;
  } | null>(null);

  // Enhanced Test Case & Verdict state
  const [testCaseResults, setTestCaseResults] = useState<any[]>([]);
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState<number>(0);
  const [submissionResult, setSubmissionResult] = useState<{
    status?: string;
    score?: number;
    maxMarks?: number;
    passedTestCases?: number;
    totalTestCases?: number;
    timeMs?: number;
    memoryMb?: number;
    compilationError?: string | null;
  } | null>(null);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState<boolean>(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState<boolean>(false);
  const [consoleHeight, setConsoleHeight] = useState<number>(410);
  const [isDraggingConsole, setIsDraggingConsole] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Mouse drag handler to resize console height upwards or downwards
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingConsole) return;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      if (newHeight >= 100 && newHeight <= windowHeight * 0.85) {
        setConsoleHeight(newHeight);
        setIsConsoleCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingConsole(false);
    };

    if (isDraggingConsole) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingConsole]);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Timer & Security state
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(3600);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [maxViolations, setMaxViolations] = useState<number>(3);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [showEndExamModal, setShowEndExamModal] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);

  const editorRef = useRef<any>(null);

  // 1. Fetch initial session data from server
  const loadExamSession = useCallback(async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/exam/${attemptId}`);
      if (!res.ok) {
        throw new Error('Failed to load exam attempt');
      }
      const data = await res.json();

      setExam(data.exam);
      setParticipant(data.participant);
      setQuestions(data.questions || []);
      setTimeRemainingSeconds(data.timeRemainingSeconds);
      setViolationCount(data.participant.violations_count || 0);
      setMaxViolations(data.exam.max_violations || 3);

      // Populate starter codes or previous submissions
      const initialCodes: Record<string, Record<string, string>> = {};
      const subsMap: Record<string, Submission> = {};

      if (Array.isArray(data.submissions)) {
        for (const sub of data.submissions) {
          subsMap[sub.question_id] = sub;
        }
      }
      setSubmissionsByQuestion(subsMap);

      for (const q of data.questions) {
        initialCodes[q.id] = {
          java: q.starter_templates?.java || '// Write Java code here\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
          cpp: q.starter_templates?.cpp || '// Write C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
          python: q.starter_templates?.python || '# Write Python code here\nimport sys\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()',
          c: q.starter_templates?.c || '// Write C code here\n#include <stdio.h>\n\nint main() {\n    return 0;\n}',
        };

        // If there's an existing submission code, load that
        if (subsMap[q.id]) {
          const subLang = subsMap[q.id].language as 'java' | 'cpp' | 'python' | 'c';
          initialCodes[q.id][subLang] = subsMap[q.id].code;
        }
      }
      setCodePerQuestion(initialCodes);

      // If already expired or submitted, redirect
      if (data.participant.status === 'SUBMITTED' || data.participant.status === 'TERMINATED') {
        navigate(`/exam/${attemptId}/result`);
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    loadExamSession();
  }, [loadExamSession]);

  // 2. Server-Authoritative Timer Countdown
  useEffect(() => {
    if (loading || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit('TIME_EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeRemainingSeconds]);

  // 3. Security Violation Handler
  const recordViolation = useCallback(
    async (eventType: string, details: string) => {
      if (!attemptId) return;
      try {
        const res = await fetch(`/api/exam/${attemptId}/security-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, details }),
        });
        const data = await res.json();

        setViolationCount(data.totalViolations);
        setWarningMessage(
          `Security Alert (${data.warning}): ${details}. Multiple violations will cause automatic assessment termination.`
        );
        setShowWarningModal(true);

        if (data.terminated) {
          alert('Maximum security violations reached. Your assessment has been terminated.');
          navigate(`/exam/${attemptId}/result`);
        }
      } catch (err) {
        console.error('Failed to log security violation:', err);
      }
    },
    [attemptId, navigate]
  );

  // 4. Browser Anti-Cheat Listeners
  useEffect(() => {
    // A. Tab switch / Visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('TAB_SWITCH', 'Switched browser tab or minimized window');
      }
    };

    // B. Fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('FULLSCREEN_EXIT', 'Exited fullscreen examination mode');
      }
    };

    // C. Right click prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('RIGHT_CLICK', 'Context menu / right click attempted');
      return false;
    };

    // D. Copy / Paste prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('COPY_ATTEMPT', 'Clipboard copy blocked');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('PASTE_ATTEMPT', 'Clipboard paste blocked');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('CUT_ATTEMPT', 'Clipboard cut blocked');
    };

    // E. Block inspection shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        recordViolation('DEVTOOLS_ATTEMPT', 'Developer tools shortcut attempted');
      }
    };

    // F. Prevent accidental page reload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the exam? Your progress might be lost.';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('cut', handleCut);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [recordViolation]);

  // Current question and code getters
  const currentQuestion = questions[currentQuestionIndex];
  const currentCode = currentQuestion
    ? codePerQuestion[currentQuestion.id]?.[selectedLanguage] || ''
    : '';

  const handleCodeChange = (newVal: string | undefined) => {
    if (!currentQuestion) return;
    setCodePerQuestion((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || {}),
        [selectedLanguage]: newVal || '',
      },
    }));
  };

  // Synchronize submission result when question index changes
  useEffect(() => {
    if (currentQuestion && submissionsByQuestion[currentQuestion.id]) {
      const sub = submissionsByQuestion[currentQuestion.id];
      setSubmissionResult({
        status: sub.status,
        score: sub.score,
        maxMarks: currentQuestion.marks,
        passedTestCases: sub.passed_test_cases,
        totalTestCases: sub.total_test_cases,
        timeMs: sub.execution_time_ms,
        memoryMb: sub.memory_kb ? Math.round((sub.memory_kb / 1024) * 10) / 10 : undefined,
      });
    } else {
      setSubmissionResult(null);
      setTestCaseResults([]);
      setExecutionOutput('Ready. Click "Run Code" to test against public test cases or custom input.');
      setExecutionErrors('');
      setExecutionDetails(null);
    }
  }, [currentQuestionIndex, currentQuestion?.id]);

  // Run Code with Custom Input or against Public Test Cases
  const handleRunCode = async () => {
    if (!currentQuestion || !attemptId) return;
    setIsRunning(true);
    setIsConsoleCollapsed(false);
    try {
      const res = await fetch(`/api/exam/${attemptId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          language: selectedLanguage,
          code: currentCode,
          customInput: customInput,
        }),
      });
      const data = await res.json();

      const hasError = Boolean(data.compilationError || data.runtimeError || (data.exitCode !== undefined && data.exitCode !== 0));
      setExecutionOutput(data.stdout || (hasError ? '' : 'No standard output produced.'));
      setExecutionErrors(data.stderr || (hasError ? (data.output || data.compilationError) : ''));
      setExecutionDetails({
        timeMs: data.timeMs || 120,
        memoryMb: data.memoryMb || 14.5,
        exitCode: data.exitCode,
        statusBadge: hasError ? (data.compilationError ? 'Compilation Error' : 'Runtime Error') : 'Executed successfully',
        isSuccess: !hasError,
      });

      if (data.testCases && Array.isArray(data.testCases) && data.testCases.length > 0) {
        setTestCaseResults(data.testCases);
        setSelectedTestCaseIndex(0);
        setSubmissionResult({
          status: hasError ? (data.compilationError ? 'Compilation Error' : 'Runtime Error') : (data.passedTestCases === data.totalTestCases ? 'All Public Tests Passed' : 'Some Tests Failed'),
          score: undefined,
          passedTestCases: data.passedTestCases,
          totalTestCases: data.totalTestCases,
          timeMs: data.timeMs,
          memoryMb: data.memoryMb,
          compilationError: data.compilationError ? (data.stderr || data.output) : null,
        });
        setActiveConsoleTab('results');
      } else {
        setTestCaseResults([]);
        setSubmissionResult(null);
        if (hasError && (data.stderr || data.compilationError)) {
          setActiveConsoleTab('errors');
        } else {
          setActiveConsoleTab('output');
        }
      }
    } catch (err: any) {
      setExecutionErrors(err.message || 'Compiler execution request failed');
      setActiveConsoleTab('errors');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution (Evaluated server-side against hidden test cases)
  const handleSubmitSolution = async () => {
    if (!currentQuestion || !attemptId) return;
    setIsSubmitting(true);
    setIsConsoleCollapsed(false);
    try {
      const res = await fetch(`/api/exam/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          language: selectedLanguage,
          code: currentCode,
        }),
      });
      const data = await res.json();

      // Record in local submissions map
      const newSub: Submission = {
        id: data.submissionId,
        participant_id: attemptId,
        question_id: currentQuestion.id,
        language: selectedLanguage,
        code: currentCode,
        status: data.status,
        score: data.score,
        passed_test_cases: data.passedTestCases,
        total_test_cases: data.totalTestCases,
        execution_time_ms: data.executionTimeMs,
        memory_kb: Math.round((data.memoryMb || 10) * 1024),
        submitted_at: new Date().toISOString(),
      };

      setSubmissionsByQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: newSub,
      }));

      const isAccepted = data.status === 'Accepted';
      setExecutionOutput(
        `Submission Status: ${data.status}\nScore Earned: ${data.score} / ${data.maxMarks}\nTest Cases Passed: ${data.passedTestCases} / ${data.totalTestCases}`
      );
      setExecutionErrors(data.compilationError ? (data.compilationError || data.output || 'Compilation error') : '');
      setExecutionDetails({
        timeMs: data.executionTimeMs,
        memoryMb: data.memoryMb,
        exitCode: 0,
        statusBadge: isAccepted ? 'Solution Accepted ✓' : `Status: ${data.status}`,
        isSuccess: isAccepted,
      });

      if (data.testCases && Array.isArray(data.testCases)) {
        setTestCaseResults(data.testCases);
        const firstFail = data.testCases.findIndex((tc: any) => !tc.passed);
        setSelectedTestCaseIndex(firstFail >= 0 ? firstFail : 0);
      } else {
        setTestCaseResults([]);
        setSelectedTestCaseIndex(0);
      }

      setSubmissionResult({
        status: data.status,
        score: data.score,
        maxMarks: data.maxMarks,
        passedTestCases: data.passedTestCases,
        totalTestCases: data.totalTestCases,
        timeMs: data.executionTimeMs,
        memoryMb: data.memoryMb,
        compilationError: data.compilationError ? (data.compilationError || data.output) : null,
      });

      setActiveConsoleTab('results');
    } catch (err: any) {
      setExecutionErrors(err.message || 'Failed to submit solution');
      setActiveConsoleTab('errors');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final submit exam
  const handleFinalSubmit = async (reason = 'USER_COMPLETED') => {
    if (!attemptId) return;
    setIsSubmittingFinal(true);
    try {
      const res = await fetch(`/api/exam/${attemptId}/final-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      await res.json();
      navigate(`/exam/${attemptId}/result`);
    } catch (err) {
      console.error(err);
      navigate(`/exam/${attemptId}/result`);
    }
  };

  // Format Timer mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B2A5B]" />
        <p className="text-sm font-semibold text-slate-600">Initializing Secure Coding Assessment Environment...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden select-none">
      {/* =================================================== */}
      {/* TOP BAR (Matches Reference Exam UI) */}
      {/* =================================================== */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Left: Hamburger + Logo + Assessment Title */}
        <div className="flex items-center gap-4">
          <img
            src="/anveshana-logo.png"
            alt="Anveshana Logo"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <div className="h-5 w-[1px] bg-slate-200" />
          <div className="hidden sm:block">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              Coding Assessment
            </h1>
          </div>
        </div>

        {/* Center: Student Name & Roll Number */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">Name:</span>
            <span className="font-semibold text-slate-900">{participant?.name || 'Student'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-400">Roll:</span>
            <span className="font-mono font-semibold text-[#0B2A5B] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {participant?.roll_number || '---'}
            </span>
          </div>
        </div>

        {/* Right: Timer & End Exam Button */}
        <div className="flex items-center gap-3">
          {/* Violations Badge */}
          {violationCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Warnings: {violationCount}/{maxViolations}</span>
            </div>
          )}

          {/* Timer Pill (matches reference: orange clock + mm:ss) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-mono font-bold shadow-xs ${
            timeRemainingSeconds < 300
              ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
              : 'bg-amber-50/70 border-amber-200/80 text-amber-800'
          }`}>
            <Clock className={`w-4 h-4 ${timeRemainingSeconds < 300 ? 'text-rose-600' : 'text-amber-600'}`} />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>

          {/* End Exam Button (coral/red button) */}
          <button
            onClick={() => setShowEndExamModal(true)}
            className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#EF4444] text-white hover:bg-[#DC2626] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>End Exam</span>
          </button>
        </div>
      </header>

      {/* =================================================== */}
      {/* MAIN THREE-COLUMN WORKSPACE */}
      {/* =================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------- */}
        {/* COLUMN 1: QUESTION NAVIGATOR (Left) */}
        {/* ------------------------------------------------- */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Questions ({questions.length})
            </h2>
          </div>

          {/* Question List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const sub = submissionsByQuestion[q.id];
              const isAnswered = sub && sub.status === 'Accepted';
              const isPartial = sub && sub.status === 'Partial Score';
              const isReviewed = markedForReview[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all flex items-center gap-3 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-50/90 border border-blue-200 text-[#0B2A5B] font-semibold shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent text-slate-700'
                  }`}
                >
                  {/* Status number badge */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isAnswered
                        ? 'bg-emerald-600 text-white'
                        : isPartial
                        ? 'bg-amber-500 text-white'
                        : isCurrent
                        ? 'bg-[#0B2A5B] text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAnswered ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>

                  <span className="truncate flex-1">{q.title}</span>

                  {isReviewed && (
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mark for review button */}
          {currentQuestion && (
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() =>
                  setMarkedForReview((prev) => ({
                    ...prev,
                    [currentQuestion.id]: !prev[currentQuestion.id],
                  }))
                }
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                  markedForReview[currentQuestion.id]
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}
                </span>
              </button>
            </div>
          )}

          {/* Status Legend (matches reference image) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0B2A5B]" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Marked for Review</span>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------- */}
        {/* COLUMN 2: PROBLEM STATEMENT (Center) */}
        {/* ------------------------------------------------- */}
        <section className="w-2/5 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          {currentQuestion ? (
            <div className="p-6 space-y-6">
              {/* Question Header & Badges */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900 font-display">
                    {currentQuestion.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {currentQuestion.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {currentQuestion.marks} Marks
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="text-sm text-slate-700 leading-relaxed space-y-4">
                <div className="whitespace-pre-line font-sans">
                  {currentQuestion.description}
                </div>
              </div>

              {/* Visible Examples / Test Cases */}
              {currentQuestion.test_cases && currentQuestion.test_cases.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Example Test Cases
                  </h3>
                  {currentQuestion.test_cases
                    .filter((tc) => !tc.is_hidden)
                    .map((tc, idx) => (
                      <div
                        key={tc.id || idx}
                        className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3 text-xs"
                      >
                        <span className="font-bold text-slate-800">Example {idx + 1}</span>
                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                              Input
                            </span>
                            <pre className="font-mono bg-white p-2 rounded-lg border border-slate-200/70 mt-1 text-slate-800 overflow-x-auto">
                              {tc.input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                              Output
                            </span>
                            <pre className="font-mono bg-white p-2 rounded-lg border border-slate-200/70 mt-1 text-slate-800 overflow-x-auto">
                              {tc.expected_output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Question Navigation Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-slate-400">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">No question selected</div>
          )}
        </section>

        {/* ------------------------------------------------- */}
        {/* COLUMN 3: MONACO CODE EDITOR & OUTPUT (Right) */}
        {/* ------------------------------------------------- */}
        <main className="flex-1 flex flex-col bg-[#1E1E1E] overflow-hidden">
          {/* Editor Header Toolbar */}
          <div className="h-11 bg-[#18181B] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="java">Java 15.0.2</option>
                  <option value="cpp">C++ 10.2.0</option>
                  <option value="python">Python 3.12.0</option>
                  <option value="c">C 10.2.0</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  editorRef.current?.getAction('editor.action.formatDocument')?.run();
                }}
                className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition flex items-center gap-1"
                title="Format Code"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Format</span>
              </button>

              <button
                onClick={() => {
                  if (currentQuestion && window.confirm('Reset code to starter template?')) {
                    const defaultTpl = currentQuestion.starter_templates?.[selectedLanguage] || '';
                    handleCodeChange(defaultTpl);
                  }
                }}
                className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition flex items-center gap-1"
                title="Reset Code"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Component */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' || selectedLanguage === 'c' ? 'cpp' : selectedLanguage}
              value={currentCode}
              onChange={handleCodeChange}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                lineNumbersMinChars: 3,
                tabSize: 4,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* Action Execution Bar (matches reference: Run Code & Submit Solution) */}
          <div className="h-11 bg-[#18181B] border-t border-zinc-800 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileCode className="w-4 h-4 text-zinc-500" />
              <span>Language: {selectedLanguage.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Run Code (Blue) */}
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Run Code</span>
              </button>

              {/* Submit Solution (Green) */}
              <button
                onClick={handleSubmitSolution}
                disabled={isRunning || isSubmitting}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white hover:bg-[#15803D] transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>Submit Solution</span>
              </button>
            </div>
          </div>

          {/* Upgraded Console & Test Evaluation Dashboard */}
          <div
            style={{
              height: isConsoleCollapsed
                ? '40px'
                : isConsoleExpanded
                ? '580px'
                : `${consoleHeight}px`,
            }}
            className="bg-white border-t border-slate-200 flex flex-col shrink-0 transition-[height] duration-75 relative select-text"
          >
            {/* Interactive Drag Handle to Resize Height Upwards / Downwards */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingConsole(true);
              }}
              onDoubleClick={() => setIsConsoleExpanded((prev) => !prev)}
              title="Drag up or down to resize console height (Double-click to expand/restore)"
              className="absolute -top-1.5 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center group z-30"
            >
              <div className="w-16 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 group-hover:h-1.5 transition-all shadow-xs" />
            </div>
            {/* Console Navigation Header */}
            <div className="h-10 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs select-none">
              {/* Tab Selectors */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {/* 1. Test Results Tab */}
                <button
                  onClick={() => {
                    setIsConsoleCollapsed(false);
                    setActiveConsoleTab('results');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeConsoleTab === 'results'
                      ? 'bg-white shadow-xs text-blue-700 border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Test Results</span>
                  {testCaseResults.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        submissionResult?.passedTestCases === submissionResult?.totalTestCases
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {submissionResult?.passedTestCases ?? 0}/{submissionResult?.totalTestCases ?? testCaseResults.length}
                    </span>
                  )}
                </button>

                {/* 2. Console Output Tab */}
                <button
                  onClick={() => {
                    setIsConsoleCollapsed(false);
                    setActiveConsoleTab('output');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeConsoleTab === 'output'
                      ? 'bg-white shadow-xs text-slate-900 border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Output</span>
                </button>

                {/* 3. Custom Input Tab */}
                <button
                  onClick={() => {
                    setIsConsoleCollapsed(false);
                    setActiveConsoleTab('input');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeConsoleTab === 'input'
                      ? 'bg-white shadow-xs text-slate-900 border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Custom Input</span>
                  {customInput.trim() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>

                {/* 4. Errors Tab */}
                <button
                  onClick={() => {
                    setIsConsoleCollapsed(false);
                    setActiveConsoleTab('errors');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    activeConsoleTab === 'errors'
                      ? 'bg-white shadow-xs text-rose-700 border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                  <span>Errors</span>
                  {executionErrors && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      !
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Execution Metrics & Height Controls */}
              <div className="flex items-center gap-2.5">
                {(submissionResult?.timeMs !== undefined || executionDetails?.timeMs !== undefined) && (
                  <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                    <span>
                      Time: <strong className="text-slate-800">{submissionResult?.timeMs ?? executionDetails?.timeMs ?? 0} ms</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Memory: <strong className="text-slate-800">{submissionResult?.memoryMb ?? executionDetails?.memoryMb ?? 0} MB</strong>
                    </span>
                    {executionDetails?.exitCode !== undefined && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>
                          Exit: <strong className="text-slate-800">{executionDetails.exitCode}</strong>
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsConsoleCollapsed(false);
                      setIsConsoleExpanded(!isConsoleExpanded);
                    }}
                    title={isConsoleExpanded ? 'Restore Normal Height' : 'Maximize Console'}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
                  >
                    {isConsoleExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                    title={isConsoleCollapsed ? 'Expand Console' : 'Collapse Console'}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
                  >
                    {isConsoleCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Console Content Area */}
            {!isConsoleCollapsed && (
              <div className="flex-1 p-3 sm:p-3.5 overflow-y-auto font-sans text-xs">
                {/* =================================================== */}
                {/* 1. TEST RESULTS TAB */}
                {/* =================================================== */}
                {activeConsoleTab === 'results' && (
                  <div className="space-y-3">
                    {/* If no test results yet */}
                    {!submissionResult && testCaseResults.length === 0 ? (
                      <div className="py-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-2xs">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Evaluation & Test Results</h4>
                        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                          Click <strong className="text-blue-600">Run Code</strong> to evaluate public sample cases, or click <strong className="text-emerald-600">Submit Solution</strong> to run all grading test cases and record your score.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* High-Impact Verdict Banner */}
                        {submissionResult && (
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs ${
                              submissionResult.status === 'Accepted'
                                ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white border-emerald-200 text-emerald-900'
                                : submissionResult.status === 'Compilation Error'
                                ? 'bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border-rose-200 text-rose-900'
                                : submissionResult.status === 'Runtime Error'
                                ? 'bg-gradient-to-r from-purple-50 via-purple-50/60 to-white border-purple-200 text-purple-900'
                                : submissionResult.status === 'Partial Score'
                                ? 'bg-gradient-to-r from-amber-50 via-amber-50/60 to-white border-amber-200 text-amber-900'
                                : 'bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border-rose-200 text-rose-900'
                            }`}
                          >
                            {/* Left: Verdict Status Badge & Icon */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  submissionResult.status === 'Accepted'
                                    ? 'bg-emerald-600 text-white'
                                    : submissionResult.status === 'Compilation Error' || submissionResult.status === 'Runtime Error'
                                    ? 'bg-rose-600 text-white'
                                    : submissionResult.status === 'Partial Score'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {submissionResult.status === 'Accepted' ? (
                                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                ) : submissionResult.status === 'Compilation Error' ? (
                                  <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                                ) : submissionResult.status === 'Partial Score' ? (
                                  <Check className="w-5 h-5 stroke-[2.5]" />
                                ) : (
                                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-extrabold tracking-tight">
                                    {submissionResult.status === 'Accepted'
                                      ? 'Solution Accepted ✓'
                                      : submissionResult.status === 'Compilation Error'
                                      ? 'Compilation Error'
                                      : submissionResult.status === 'Runtime Error'
                                      ? 'Runtime Exception'
                                      : submissionResult.status === 'Partial Score'
                                      ? 'Partial Score Awarded'
                                      : submissionResult.status || 'Wrong Answer'}
                                  </h3>
                                  {submissionResult.score !== undefined && submissionResult.maxMarks !== undefined && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono ${
                                        submissionResult.status === 'Accepted'
                                          ? 'bg-emerald-200/70 text-emerald-900'
                                          : 'bg-slate-200 text-slate-800'
                                      }`}
                                    >
                                      Score: {submissionResult.score} / {submissionResult.maxMarks}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] opacity-80 mt-0.5">
                                  {submissionResult.status === 'Accepted'
                                    ? 'All test cases passed successfully within runtime and memory limits.'
                                    : submissionResult.status === 'Compilation Error'
                                    ? 'Code failed to compile. Inspect the Errors tab for diagnostics.'
                                    : 'Review individual test cases below to resolve mismatches.'}
                                </p>
                              </div>
                            </div>

                            {/* Right: Progress bar & Test Counts */}
                            {submissionResult.totalTestCases !== undefined && (
                              <div className="flex flex-col sm:items-end gap-1.5 shrink-0 min-w-[160px]">
                                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                                  <span>Passed:</span>
                                  <span className="font-mono font-bold">
                                    {submissionResult.passedTestCases} / {submissionResult.totalTestCases} Test Cases
                                  </span>
                                </div>
                                <div className="w-full sm:w-44 h-2 bg-black/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      submissionResult.passedTestCases === submissionResult.totalTestCases
                                        ? 'bg-emerald-600'
                                        : 'bg-amber-500'
                                    }`}
                                    style={{
                                      width: `${
                                        submissionResult.totalTestCases > 0
                                          ? Math.round(
                                              ((submissionResult.passedTestCases || 0) /
                                                submissionResult.totalTestCases) *
                                                100
                                            )
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Test Case Selection Tabs */}
                        {testCaseResults.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                              {testCaseResults.map((tc, idx) => {
                                const isSelected = idx === selectedTestCaseIndex;
                                const isHidden = tc.type === 'HIDDEN';
                                const passed = tc.passed;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedTestCaseIndex(idx)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shrink-0 ${
                                      isSelected
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                                    }`}
                                  >
                                    {passed ? (
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 ${
                                          isSelected ? 'text-emerald-400' : 'text-emerald-600'
                                        }`}
                                      />
                                    ) : (
                                      <XCircle
                                        className={`w-3.5 h-3.5 ${
                                          isSelected ? 'text-rose-400' : 'text-rose-600'
                                        }`}
                                      />
                                    )}

                                    <span>Case {tc.caseNumber || idx + 1}</span>

                                    {isHidden && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono flex items-center gap-1 ${
                                          isSelected
                                            ? 'bg-slate-800 text-amber-300'
                                            : 'bg-slate-200 text-amber-700'
                                        }`}
                                      >
                                        <Lock className="w-2.5 h-2.5" />
                                        Hidden
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Detailed Inspector for Selected Case */}
                            {testCaseResults[selectedTestCaseIndex] && (() => {
                              const tc = testCaseResults[selectedTestCaseIndex];
                              const isHidden = tc.type === 'HIDDEN';

                              if (isHidden) {
                                return (
                                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                                      <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <h5 className="text-xs font-bold text-slate-900">
                                          Hidden Evaluation Test Case #{tc.caseNumber || selectedTestCaseIndex + 1}
                                        </h5>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            tc.passed
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {tc.passed ? 'PASSED ✓' : 'FAILED ✗'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                        This test case is confidential to ensure examination integrity. Input and expected values are evaluated on the server without client disclosure.
                                      </p>
                                      <div className="flex items-center gap-4 pt-1 text-xs font-mono text-slate-500">
                                        <span>
                                          Execution Time: <strong className="text-slate-800">{tc.timeMs ?? 0} ms</strong>
                                        </span>
                                        {tc.marks !== undefined && (
                                          <span>
                                            Weight: <strong className="text-slate-800">{tc.marks} marks</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              // PUBLIC Test Case Inspector
                              return (
                                <div className="space-y-3">
                                  {/* Status note if failed */}
                                  {!tc.passed && (
                                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-medium">
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span>
                                        Output mismatch detected. Ensure format, whitespace, and edge conditions match the problem specification.
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                                    {/* 1. Input */}
                                    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                      <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-slate-600 font-sans font-semibold text-[11px]">
                                        <span>Input (stdin)</span>
                                        {tc.input && (
                                          <button
                                            onClick={() => copyToClipboard(tc.input, `tc-in-${selectedTestCaseIndex}`)}
                                            className="text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-sans"
                                          >
                                            <Copy className="w-3 h-3" />
                                            <span>{copiedKey === `tc-in-${selectedTestCaseIndex}` ? 'Copied' : 'Copy'}</span>
                                          </button>
                                        )}
                                      </div>
                                      <pre className="p-3 text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-36 leading-relaxed">
                                        {tc.input || '(empty input)'}
                                      </pre>
                                    </div>

                                    {/* 2. Your Output */}
                                    <div
                                      className={`flex flex-col rounded-xl border overflow-hidden shadow-2xs ${
                                        tc.passed
                                          ? 'border-emerald-200 bg-emerald-50/20'
                                          : 'border-rose-200 bg-rose-50/20'
                                      }`}
                                    >
                                      <div
                                        className={`px-3 py-1.5 border-b flex items-center justify-between font-sans font-semibold text-[11px] ${
                                          tc.passed
                                            ? 'bg-emerald-100/60 border-emerald-200 text-emerald-800'
                                            : 'bg-rose-100/60 border-rose-200 text-rose-800'
                                        }`}
                                      >
                                        <span>Your Output</span>
                                        <span className="font-bold">{tc.passed ? '✓ Matches' : '✗ Mismatch'}</span>
                                      </div>
                                      <pre className="p-3 text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-36 leading-relaxed">
                                        {tc.actualOutput !== undefined && tc.actualOutput !== ''
                                          ? tc.actualOutput
                                          : '(no output produced)'}
                                      </pre>
                                    </div>

                                    {/* 3. Expected Output */}
                                    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                                      <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-slate-600 font-sans font-semibold text-[11px]">
                                        <span>Expected Output</span>
                                      </div>
                                      <pre className="p-3 text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-36 leading-relaxed">
                                        {tc.expectedOutput || '(empty expected output)'}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* =================================================== */}
                {/* 2. CONSOLE STDOUT TAB */}
                {/* =================================================== */}
                {activeConsoleTab === 'output' && (
                  <div className="h-full flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Standard Output (stdout)</span>
                      {executionOutput && (
                        <button
                          onClick={() => copyToClipboard(executionOutput, 'stdout')}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === 'stdout' ? 'Copied!' : 'Copy Output'}</span>
                        </button>
                      )}
                    </div>
                    <pre className="flex-1 p-3.5 bg-zinc-950 text-zinc-100 rounded-xl font-mono text-xs overflow-y-auto whitespace-pre-wrap leading-relaxed border border-zinc-800 shadow-inner">
                      {executionOutput || 'No output produced.'}
                    </pre>
                  </div>
                )}

                {/* =================================================== */}
                {/* 3. CUSTOM INPUT (STDIN) TAB */}
                {/* =================================================== */}
                {activeConsoleTab === 'input' && (
                  <div className="h-full flex flex-col space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Provide custom input (stdin) for testing your code:</span>
                      {customInput && (
                        <button
                          onClick={() => setCustomInput('')}
                          className="text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter test input data (e.g., numbers, strings, or lines of input)..."
                      className="flex-1 w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none bg-slate-50/70 leading-relaxed text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400">
                      Note: When custom input is provided, clicking <strong>Run Code</strong> will execute using this input. Clear this box to run against public test cases.
                    </p>
                  </div>
                )}

                {/* =================================================== */}
                {/* 4. ERRORS TAB */}
                {/* =================================================== */}
                {activeConsoleTab === 'errors' && (
                  <div className="h-full flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Compiler Diagnostics & Runtime Trace</span>
                      </span>
                      {executionErrors && (
                        <button
                          onClick={() => copyToClipboard(executionErrors, 'errors')}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedKey === 'errors' ? 'Copied!' : 'Copy Error Trace'}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex-1 p-3.5 bg-rose-950/10 border border-rose-200 rounded-xl overflow-y-auto">
                      {executionErrors ? (
                        <pre className="font-mono text-xs text-rose-700 whitespace-pre-wrap leading-relaxed">
                          {executionErrors}
                        </pre>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          No compilation or runtime errors recorded.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =================================================== */}
      {/* SECURITY VIOLATION WARNING MODAL */}
      {/* =================================================== */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-5 border border-amber-200 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Security Violation Warning
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {warningMessage}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold">
              Violation Count: {violationCount} of {maxViolations} permitted warnings
            </div>

            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* END EXAM CONFIRMATION MODAL */}
      {/* =================================================== */}
      {showEndExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-100 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Ready to End Your Assessment?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Once submitted, you will not be able to return or modify your code. Your solutions will be permanently evaluated against all test cases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEndExamModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel & Continue
              </button>
              <button
                onClick={() => {
                  setShowEndExamModal(false);
                  handleFinalSubmit('USER_COMPLETED');
                }}
                disabled={isSubmittingFinal}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#EF4444] text-white hover:bg-[#DC2626] transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingFinal ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Final Submit</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
