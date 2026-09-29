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
  Radio,
  Circle,
  Layers,
  Send,
  Info,
  ListChecks,
} from 'lucide-react';
import { Question, Submission, SubmissionStatus, Section } from '../types';

export const ExamInterface: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // Exam and session state
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Section states
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [sectionStates, setSectionStates] = useState<Record<string, { status: string; started_at?: string; submitted_at?: string }>>({});
  const [sectionTimeRemainingSeconds, setSectionTimeRemainingSeconds] = useState<number | null>(null);
  const [showSectionIntro, setShowSectionIntro] = useState<boolean>(false);
  const [showSubmitSectionModal, setShowSubmitSectionModal] = useState<boolean>(false);
  const [isSubmittingSection, setIsSubmittingSection] = useState<boolean>(false);

  // MCQ state
  const [selectedMcqOptionId, setSelectedMcqOptionId] = useState<Record<string, string>>({});
  const [isSavingMcq, setIsSavingMcq] = useState<boolean>(false);

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

      // Populate sections and section states
      const loadedSections: Section[] = data.sections || [];
      setSections(loadedSections);
      const states = data.sectionStates || {};
      setSectionStates(states);

      const activeSecId = data.currentSectionId || (loadedSections[0]?.id ?? null);
      setCurrentSectionId(activeSecId);

      if (typeof data.sectionTimeRemainingSeconds === 'number') {
        setSectionTimeRemainingSeconds(data.sectionTimeRemainingSeconds);
      } else {
        setSectionTimeRemainingSeconds(null);
      }

      // Check if section intro should be shown
      if (
        data.exam?.exam_type === 'SECTIONAL' &&
        activeSecId &&
        states[activeSecId]?.status === 'NOT_STARTED'
      ) {
        setShowSectionIntro(true);
      }

      // Populate starter codes or previous submissions
      const initialCodes: Record<string, Record<string, string>> = {};
      const subsMap: Record<string, Submission> = {};
      const mcqSelections: Record<string, string> = {};

      if (Array.isArray(data.submissions)) {
        for (const sub of data.submissions) {
          subsMap[sub.question_id] = sub;
          if (sub.selected_option_id) {
            mcqSelections[sub.question_id] = sub.selected_option_id;
          } else if (sub.question_type === 'MCQ' && sub.code) {
            mcqSelections[sub.question_id] = sub.code;
          }
        }
      }
      setSubmissionsByQuestion(subsMap);
      setSelectedMcqOptionId(mcqSelections);

      for (const q of data.questions || []) {
        initialCodes[q.id] = {
          java: q.starter_templates?.java || '// Write Java code here\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}',
          cpp: q.starter_templates?.cpp || '// Write C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
          python: q.starter_templates?.python || '# Write Python code here\nimport sys\n\ndef main():\n    pass\n\nif __name__ == "__main__":\n    main()',
          c: q.starter_templates?.c || '// Write C code here\n#include <stdio.h>\n\nint main() {\n    return 0;\n}',
        };

        // If there's an existing submission code, load that
        if (subsMap[q.id] && subsMap[q.id].code) {
          const subLang = subsMap[q.id].language as 'java' | 'cpp' | 'python' | 'c';
          if (initialCodes[q.id][subLang] !== undefined) {
            initialCodes[q.id][subLang] = subsMap[q.id].code || '';
          }
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

  // 2. Server-Authoritative Overall Exam Timer Countdown
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

  // Determine active section & active questions
  const isSectional = exam?.exam_type === 'SECTIONAL' && sections.length > 0;
  const activeSection = isSectional && currentSectionId ? sections.find((s) => s.id === currentSectionId) : null;
  const activeQuestions = isSectional && currentSectionId
    ? questions.filter((q) => q.section_id === currentSectionId)
    : questions;

  const safeQuestionIndex = Math.min(currentQuestionIndex, Math.max(0, activeQuestions.length - 1));
  const currentQuestion = activeQuestions[safeQuestionIndex];
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

  // ----------------------------------------------------
  // Section-specific Countdown Timer (Auto-submits section at 00:00)
  // ----------------------------------------------------
  const handleAutoSubmitSection = useCallback(async () => {
    if (!attemptId || !currentSectionId) return;
    try {
      const res = await fetch(`/api/exam/${attemptId}/sections/${currentSectionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoExpired: true }),
      });
      const data = await res.json();
      setShowSubmitSectionModal(false);

      if (data.sectionStates) {
        setSectionStates(data.sectionStates);
      }

      if (data.isLastSection) {
        alert('Section time expired! All sections have been completed. Finalizing assessment.');
        await handleFinalSubmit('TIME_EXPIRED');
      } else if (data.nextSectionId) {
        setCurrentSectionId(data.nextSectionId);
        setCurrentQuestionIndex(0);
        const nextSec = sections.find((s) => s.id === data.nextSectionId);
        if (nextSec && nextSec.duration_minutes && nextSec.duration_minutes > 0) {
          setSectionTimeRemainingSeconds(nextSec.duration_minutes * 60);
        } else {
          setSectionTimeRemainingSeconds(null);
        }
        setShowSectionIntro(true);
      }
    } catch (err) {
      console.error('Failed to auto-submit section:', err);
    }
  }, [attemptId, currentSectionId, sections]);

  useEffect(() => {
    if (loading || sectionTimeRemainingSeconds === null || sectionTimeRemainingSeconds <= 0 || showSectionIntro) return;

    const timer = setInterval(() => {
      setSectionTimeRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, sectionTimeRemainingSeconds, showSectionIntro, handleAutoSubmitSection]);

  // Start Section handler
  const handleStartSection = async () => {
    if (!attemptId || !currentSectionId) return;
    try {
      const res = await fetch(`/api/exam/${attemptId}/sections/${currentSectionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.sectionStates) {
        setSectionStates(data.sectionStates);
      }
      if (activeSection && activeSection.duration_minutes && activeSection.duration_minutes > 0) {
        setSectionTimeRemainingSeconds(activeSection.duration_minutes * 60);
      }
      setShowSectionIntro(false);
    } catch (err) {
      console.error('Failed to start section:', err);
      setShowSectionIntro(false);
    }
  };

  // Submit Section handler
  const handleSectionSubmit = async (autoExpired = false) => {
    if (!attemptId || !currentSectionId) return;
    setIsSubmittingSection(true);
    try {
      const res = await fetch(`/api/exam/${attemptId}/sections/${currentSectionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoExpired }),
      });
      const data = await res.json();
      setShowSubmitSectionModal(false);

      if (data.sectionStates) {
        setSectionStates(data.sectionStates);
      }

      if (data.isLastSection) {
        alert(autoExpired ? 'Section time expired! All sections have been completed. Finalizing assessment.' : 'All sections have been completed. Submitting your final assessment.');
        await handleFinalSubmit('ALL_SECTIONS_COMPLETED');
      } else if (data.nextSectionId) {
        setCurrentSectionId(data.nextSectionId);
        setCurrentQuestionIndex(0);
        const nextSec = sections.find((s) => s.id === data.nextSectionId);
        if (nextSec && nextSec.duration_minutes && nextSec.duration_minutes > 0) {
          setSectionTimeRemainingSeconds(nextSec.duration_minutes * 60);
        } else {
          setSectionTimeRemainingSeconds(null);
        }
        setShowSectionIntro(true);
      }
    } catch (err) {
      console.error('Failed to submit section:', err);
    } finally {
      setIsSubmittingSection(false);
    }
  };

  // Switch Section from Navigation Bar
  const handleSwitchSection = (targetSection: Section) => {
    if (targetSection.id === currentSectionId) return;

    const targetState = sectionStates[targetSection.id]?.status || 'NOT_STARTED';
    if (targetState === 'LOCKED') {
      alert('This section is locked and cannot be reopened.');
      return;
    }

    const currentIdx = sections.findIndex((s) => s.id === currentSectionId);
    const targetIdx = sections.findIndex((s) => s.id === targetSection.id);
    const isSequential = (activeSection?.navigation_mode || 'FREE') === 'SEQUENTIAL';

    if (isSequential && targetIdx > currentIdx) {
      alert('Sequential navigation: please complete and submit your current section before proceeding to the next section.');
      return;
    }

    if (targetIdx < currentIdx && activeSection?.allow_previous_section === false) {
      alert('Returning to previous sections is disabled for this assessment.');
      return;
    }

    setCurrentSectionId(targetSection.id);
    setCurrentQuestionIndex(0);

    if (targetSection.duration_minutes && targetSection.duration_minutes > 0) {
      const startedAt = sectionStates[targetSection.id]?.started_at;
      if (startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        setSectionTimeRemainingSeconds(Math.max(0, targetSection.duration_minutes * 60 - elapsed));
      } else {
        setSectionTimeRemainingSeconds(targetSection.duration_minutes * 60);
      }
    } else {
      setSectionTimeRemainingSeconds(null);
    }

    if (targetState === 'NOT_STARTED') {
      setShowSectionIntro(true);
    } else {
      setShowSectionIntro(false);
    }
  };

  // MCQ Selection and Submission Handlers
  const handleSelectMcqOption = (optionId: string) => {
    if (!currentQuestion) return;
    setSelectedMcqOptionId((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleSaveMcqAnswer = async (advanceNext = false) => {
    if (!attemptId || !currentQuestion) return;
    setIsSavingMcq(true);
    try {
      const optId = selectedMcqOptionId[currentQuestion.id] || '';
      const res = await fetch(`/api/exam/${attemptId}/mcq-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOptionId: optId,
        }),
      });
      const data = await res.json();

      const newSub: Submission = {
        id: data.submissionId || `sub-${Date.now()}`,
        participant_id: attemptId,
        question_id: currentQuestion.id,
        section_id: currentQuestion.section_id || undefined,
        question_type: 'MCQ',
        language: 'mcq',
        code: optId,
        selected_option_id: optId,
        status: data.status,
        score: data.score,
        passed_test_cases: data.score > 0 ? 1 : 0,
        total_test_cases: 1,
        execution_time_ms: 0,
        memory_kb: 0,
        submitted_at: new Date().toISOString(),
      };

      setSubmissionsByQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: newSub,
      }));

      if (advanceNext && safeQuestionIndex < activeQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to save MCQ answer:', err);
    } finally {
      setIsSavingMcq(false);
    }
  };

  const handleClearMcqSelection = async () => {
    if (!attemptId || !currentQuestion) return;
    setSelectedMcqOptionId((prev) => ({
      ...prev,
      [currentQuestion.id]: '',
    }));
    try {
      await fetch(`/api/exam/${attemptId}/mcq-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOptionId: '',
        }),
      });
      setSubmissionsByQuestion((prev) => {
        const copy = { ...prev };
        delete copy[currentQuestion.id];
        return copy;
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
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
      {/* =================================================== */}
      {/* TOP BAR (Matches Reference Exam UI & Requirements) */}
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
              {exam?.title || 'Coding Assessment'}
            </h1>
            {isSectional && activeSection && (
              <span className="text-[11px] font-semibold text-blue-600 block leading-tight">
                Section {activeSection.order_number || (sections.findIndex((s) => s.id === activeSection.id) + 1)}: {activeSection.name}
              </span>
            )}
          </div>
        </div>

        {/* Center: Student Name & Roll Number + Current Question Counter */}
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
          {activeQuestions.length > 0 && !showSectionIntro && (
            <div className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
              {isSectional && activeSection
                ? `Section ${activeSection.order_number || (sections.findIndex((s) => s.id === activeSection.id) + 1)} — Q${safeQuestionIndex + 1} of ${activeQuestions.length}`
                : `Question ${safeQuestionIndex + 1} of ${activeQuestions.length}`}
            </div>
          )}
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
      {/* SECTION NAVIGATION BAR (Requirement 12 & 21) */}
      {/* =================================================== */}
      {isSectional && (
        <nav className="h-11 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between overflow-x-auto text-xs shrink-0 select-none z-20">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">
              Sections:
            </span>
            {sections.map((sec, idx) => {
              const isCurrent = sec.id === currentSectionId;
              const state = sectionStates[sec.id]?.status || 'NOT_STARTED';
              const isLocked = state === 'LOCKED';
              const isCompleted = state === 'COMPLETED';
              const secQuestions = questions.filter((q) => q.section_id === sec.id);

              return (
                <button
                  key={sec.id}
                  onClick={() => handleSwitchSection(sec)}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 hover:bg-emerald-900/60'
                      : isLocked
                      ? 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                  }`}
                >
                  {/* Status Indicator (Lucide Icons) */}
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Radio className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
                  ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}

                  <span>{idx + 1}. {sec.name}</span>

                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-normal ${
                    isCurrent ? 'bg-blue-700 text-blue-100' : 'bg-slate-900/80 text-slate-400'
                  }`}>
                    {sec.question_type} • {secQuestions.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            {sectionTimeRemainingSeconds !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                sectionTimeRemainingSeconds < 300
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500 animate-pulse'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800'
              }`}>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Section: {formatTime(sectionTimeRemainingSeconds)}</span>
              </div>
            )}

            <button
              onClick={() => setShowSubmitSectionModal(true)}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Section</span>
            </button>
          </div>
        </nav>
      )}

      {/* =================================================== */}
      {/* MAIN WORKSPACE OR SECTION INTRODUCTION */}
      {/* =================================================== */}
      {showSectionIntro && activeSection ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0B2A5B] border border-blue-100 uppercase tracking-widest">
                Section {activeSection.order_number || (sections.findIndex((s) => s.id === activeSection.id) + 1)}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">
                {activeSection.name}
              </h2>
              {activeSection.description && (
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  {activeSection.description}
                </p>
              )}
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Question Type</span>
                <span className="text-sm font-bold text-[#0B2A5B]">{activeSection.question_type}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
                <span className="text-sm font-bold text-slate-800">{activeQuestions.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Marks</span>
                <span className="text-sm font-bold text-emerald-600">
                  {activeSection.total_marks || activeQuestions.reduce((sum, q) => sum + q.marks, 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                <span className="text-sm font-bold text-amber-600">
                  {activeSection.duration_minutes ? `${activeSection.duration_minutes} Minutes` : 'Untimed'}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3 text-xs text-slate-700">
              <h4 className="font-bold text-[#0B2A5B] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Section Guidelines & Rules</span>
              </h4>
              <ul className="space-y-2 list-disc list-inside text-slate-600 leading-relaxed">
                {activeSection.question_type === 'MCQ' && (
                  <>
                    <li>Each question has multiple choices with <strong>exactly one correct answer</strong>.</li>
                    <li>Select an option and click <strong>Save Answer</strong> to record your response.</li>
                    <li>Unanswered questions receive 0 marks.</li>
                  </>
                )}
                {activeSection.question_type === 'CODING' && (
                  <>
                    <li>Write and test your code in Java, C++, Python, or C.</li>
                    <li>Click <strong>Run Code</strong> to test against public test cases.</li>
                    <li>Click <strong>Submit Solution</strong> to run evaluation against all public and hidden test cases.</li>
                  </>
                )}
                {activeSection.question_type === 'MIXED' && (
                  <>
                    <li>This section contains both <strong>Multiple Choice Questions</strong> and <strong>Coding Problems</strong>.</li>
                    <li>Navigate using the left question index to select problems.</li>
                  </>
                )}
                <li>
                  Navigation Mode: <strong>{activeSection.navigation_mode === 'SEQUENTIAL' ? 'Sequential Navigation' : 'Free Navigation'}</strong>.
                </li>
                {activeSection.lock_after_submission ? (
                  <li className="text-rose-600 font-semibold">
                    Warning: Once you submit this section, it will be locked and cannot be reopened.
                  </li>
                ) : (
                  <li className="text-slate-600">
                    You can return to review this section before the final assessment submission.
                  </li>
                )}
              </ul>
            </div>

            {/* Start Section Button */}
            <button
              onClick={handleStartSection}
              className="w-full py-3.5 rounded-2xl text-sm font-bold bg-[#0B2A5B] hover:bg-[#123773] text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Section</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* ------------------------------------------------- */}
          {/* COLUMN 1: QUESTION NAVIGATOR (Left) */}
          {/* ------------------------------------------------- */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Questions ({activeQuestions.length})
              </h2>
              {isSectional && activeSection && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {activeSection.question_type}
                </span>
              )}
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeQuestions.map((q, idx) => {
                const isCurrent = idx === safeQuestionIndex;
                const sub = submissionsByQuestion[q.id];
                const isAnswered = sub && (sub.status === 'Accepted' || (q.question_type === 'MCQ' && (sub.selected_option_id || sub.code)));
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

                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      q.question_type === 'MCQ' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {q.question_type || 'CODE'}
                    </span>

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
                  disabled={safeQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <span className="text-slate-400">
                  {safeQuestionIndex + 1} of {activeQuestions.length}
                </span>
                <button
                  disabled={safeQuestionIndex === activeQuestions.length - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
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
        {/* COLUMN 3: RESPONSE WORKSPACE (Right) */}
        {/* If question_type === 'MCQ', render MCQ Card. If 'CODING', render Monaco Editor */}
        {/* ------------------------------------------------- */}
        {currentQuestion?.question_type === 'MCQ' ? (
          <main className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
            {/* Top Toolbar */}
            <div className="h-11 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  MULTIPLE CHOICE QUESTION
                </span>
                {currentQuestion.negative_marks ? (
                  <span className="text-[11px] text-rose-600 font-medium">
                    (Negative Marking: -{currentQuestion.negative_marks} on incorrect answer)
                  </span>
                ) : null}
              </div>

              {submissionsByQuestion[currentQuestion.id] && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Response Recorded</span>
                </div>
              )}
            </div>

            {/* Options Selection Body */}
            <div className="flex-1 p-6 sm:p-10 max-w-3xl w-full mx-auto space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Options
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  Select the single best answer for this question:
                </p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = selectedMcqOptionId[currentQuestion.id] === opt.id;

                    return (
                      <label
                        key={opt.id || optIdx}
                        onClick={() => handleSelectMcqOption(opt.id)}
                        className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Letter Badge */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#0B2A5B] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </div>

                        {/* Radio Bullet */}
                        <div className="pt-1.5 shrink-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Option Text */}
                        <span
                          className={`text-sm leading-relaxed ${
                            isSelected ? 'text-blue-950 font-medium' : 'text-slate-700'
                          }`}
                        >
                          {opt.text}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                    No options found for this MCQ.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearMcqSelection}
                  disabled={!selectedMcqOptionId[currentQuestion.id]}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Selection
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMarkedForReview((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id],
                    }))
                  }
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                    markedForReview[currentQuestion.id]
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveMcqAnswer(false)}
                  disabled={isSavingMcq || !selectedMcqOptionId[currentQuestion.id]}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingMcq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Answer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveMcqAnswer(true)}
                  disabled={isSavingMcq || !selectedMcqOptionId[currentQuestion.id]}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingMcq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save & Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </main>
        ) : (
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
                        {submissionResult && (() => {
                          const isAllPassed =
                            submissionResult.status === 'Accepted' ||
                            submissionResult.status === 'All Public Tests Passed' ||
                            (submissionResult.totalTestCases !== undefined &&
                              submissionResult.totalTestCases > 0 &&
                              submissionResult.passedTestCases === submissionResult.totalTestCases);
                          const isPartial = submissionResult.status === 'Partial Score';
                          const isCompError = submissionResult.status === 'Compilation Error';
                          const isRuntimeError = submissionResult.status === 'Runtime Error';

                          return (
                            <div
                              className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs ${
                                isAllPassed
                                  ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white border-emerald-300 text-emerald-950'
                                  : isCompError
                                  ? 'bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border-rose-300 text-rose-950'
                                  : isRuntimeError
                                  ? 'bg-gradient-to-r from-purple-50 via-purple-50/60 to-white border-purple-300 text-purple-950'
                                  : isPartial
                                  ? 'bg-gradient-to-r from-amber-50 via-amber-50/60 to-white border-amber-300 text-amber-950'
                                  : 'bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border-rose-300 text-rose-950'
                              }`}
                            >
                              {/* Left: Verdict Status Badge & Icon */}
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                                    isAllPassed
                                      ? 'bg-emerald-600 text-white'
                                      : isCompError || isRuntimeError
                                      ? 'bg-rose-600 text-white'
                                      : isPartial
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {isAllPassed ? (
                                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                  ) : isCompError ? (
                                    <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                                  ) : isPartial ? (
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                  ) : (
                                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-extrabold tracking-tight">
                                      {isAllPassed
                                        ? (submissionResult.status === 'Accepted' ? 'Solution Accepted ✓' : 'All Public Tests Passed ✓')
                                        : isCompError
                                        ? 'Compilation Error'
                                        : isRuntimeError
                                        ? 'Runtime Exception'
                                        : isPartial
                                        ? 'Partial Score Awarded'
                                        : submissionResult.status || 'Some Tests Failed'}
                                    </h3>
                                    {submissionResult.score !== undefined && submissionResult.maxMarks !== undefined && (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono ${
                                          isAllPassed
                                            ? 'bg-emerald-200/70 text-emerald-900'
                                            : 'bg-slate-200 text-slate-800'
                                        }`}
                                      >
                                        Score: {submissionResult.score} / {submissionResult.maxMarks}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] opacity-80 mt-0.5">
                                    {isAllPassed
                                      ? 'All test cases passed successfully! Code output matches expected format.'
                                      : isCompError
                                      ? 'Code failed to compile. Inspect the Errors tab for diagnostics.'
                                      : isRuntimeError
                                      ? 'Runtime exception occurred during execution.'
                                      : 'Review individual test cases below to resolve mismatches.'}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Progress bar & Test Counts */}
                              {submissionResult.totalTestCases !== undefined && (
                                <div className="flex flex-col sm:items-end gap-1.5 shrink-0 min-w-[160px]">
                                  <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                                    <span>Passed:</span>
                                    <span className={`font-mono font-bold ${isAllPassed ? 'text-emerald-700' : 'text-slate-800'}`}>
                                      {submissionResult.passedTestCases} / {submissionResult.totalTestCases} Test Cases
                                    </span>
                                  </div>
                                  <div className="w-full sm:w-44 h-2 bg-black/10 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isAllPassed ? 'bg-emerald-600' : 'bg-rose-500'
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
                          );
                        })()}

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
                                      passed
                                        ? isSelected
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : isSelected
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    {passed ? (
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 ${
                                          isSelected ? 'text-white' : 'text-emerald-600'
                                        }`}
                                      />
                                    ) : (
                                      <XCircle
                                        className={`w-3.5 h-3.5 ${
                                          isSelected ? 'text-white' : 'text-rose-600'
                                        }`}
                                      />
                                    )}

                                    <span>Case {tc.caseNumber || idx + 1}</span>

                                    {isHidden && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono flex items-center gap-1 ${
                                          isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-amber-800'
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
      )}
      </div>
      )}

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

      {/* =================================================== */}
      {/* SUBMIT SECTION CONFIRMATION MODAL (Requirement 15) */}
      {/* =================================================== */}
      {showSubmitSectionModal && activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-100 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Section Submission
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Submit {activeSection.name}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have answered{' '}
                <strong>
                  {
                    activeQuestions.filter((q) => {
                      const sub = submissionsByQuestion[q.id];
                      return sub && (sub.status === 'Accepted' || (q.question_type === 'MCQ' && (sub.selected_option_id || sub.code)));
                    }).length
                  }
                </strong>{' '}
                of <strong>{activeQuestions.length}</strong> questions in this section.
              </p>
            </div>

            {activeSection.lock_after_submission && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Warning: Once submitted, this section will be locked. You will NOT be able to change or review answers in this section.
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitSectionModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel & Review
              </button>
              <button
                onClick={() => handleSectionSubmit(false)}
                disabled={isSubmittingSection}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSubmittingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Submit</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
