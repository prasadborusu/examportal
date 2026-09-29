import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Layers,
  HelpCircle,
  Code2,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Clock,
  Award,
  CheckCircle2,
  Lock,
  Compass,
} from 'lucide-react';
import { BACKEND_URL } from '../../api/config';
import { ExamType, SectionQuestionType, SectionNavigationMode } from '../../types';

interface SectionDraft {
  id: string;
  name: string;
  description: string;
  question_type: SectionQuestionType;
  duration_minutes: number;
  total_marks: number;
  question_limit?: number;
  navigation_mode: SectionNavigationMode;
  lock_after_submission: boolean;
  allow_previous_section: boolean;
  order_number: number;
}

export const AdminCreateExam: React.FC = () => {
  const navigate = useNavigate();

  const generatePasskey = () => String(Math.floor(1000 + Math.random() * 9000));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<ExamType>('FULL');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [maxViolations, setMaxViolations] = useState('3');
  const [passkey, setPasskey] = useState(generatePasskey());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section Builder state for Sectional Exams
  const [sections, setSections] = useState<SectionDraft[]>([
    {
      id: `sec-${Date.now()}-1`,
      name: 'Quantitative & Verbal Aptitude',
      description: 'Multiple choice questions assessing foundational problem-solving and aptitude',
      question_type: 'MCQ',
      duration_minutes: 30,
      total_marks: 30,
      navigation_mode: 'FREE',
      lock_after_submission: true,
      allow_previous_section: true,
      order_number: 1,
    },
    {
      id: `sec-${Date.now()}-2`,
      name: 'Core Programming & Data Structures',
      description: 'Coding challenges evaluated automatically with test cases',
      question_type: 'CODING',
      duration_minutes: 60,
      total_marks: 70,
      navigation_mode: 'FREE',
      lock_after_submission: true,
      allow_previous_section: false,
      order_number: 2,
    },
  ]);

  // Section Modal state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [secFormName, setSecFormName] = useState('');
  const [secFormDesc, setSecFormDesc] = useState('');
  const [secFormType, setSecFormType] = useState<SectionQuestionType>('MCQ');
  const [secFormDuration, setSecFormDuration] = useState('30');
  const [secFormMarks, setSecFormMarks] = useState('50');
  const [secFormQuestionLimit, setSecFormQuestionLimit] = useState('');
  const [secFormNavMode, setSecFormNavMode] = useState<SectionNavigationMode>('FREE');
  const [secFormLockAfter, setSecFormLockAfter] = useState(true);
  const [secFormAllowPrev, setSecFormAllowPrev] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(passkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openAddSectionModal = () => {
    setEditingSectionId(null);
    setSecFormName(`Section ${sections.length + 1}`);
    setSecFormDesc('');
    setSecFormType('MCQ');
    setSecFormDuration('30');
    setSecFormMarks('30');
    setSecFormQuestionLimit('');
    setSecFormNavMode('FREE');
    setSecFormLockAfter(true);
    setSecFormAllowPrev(true);
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (sec: SectionDraft) => {
    setEditingSectionId(sec.id);
    setSecFormName(sec.name);
    setSecFormDesc(sec.description || '');
    setSecFormType(sec.question_type);
    setSecFormDuration(String(sec.duration_minutes));
    setSecFormMarks(String(sec.total_marks));
    setSecFormQuestionLimit(sec.question_limit ? String(sec.question_limit) : '');
    setSecFormNavMode(sec.navigation_mode);
    setSecFormLockAfter(sec.lock_after_submission);
    setSecFormAllowPrev(sec.allow_previous_section);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secFormName.trim()) return;

    if (editingSectionId) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === editingSectionId
            ? {
                ...s,
                name: secFormName.trim(),
                description: secFormDesc.trim(),
                question_type: secFormType,
                duration_minutes: Number(secFormDuration) || 30,
                total_marks: Number(secFormMarks) || 30,
                question_limit: secFormQuestionLimit ? Number(secFormQuestionLimit) : undefined,
                navigation_mode: secFormNavMode,
                lock_after_submission: secFormLockAfter,
                allow_previous_section: secFormAllowPrev,
              }
            : s
        )
      );
    } else {
      const newSec: SectionDraft = {
        id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: secFormName.trim(),
        description: secFormDesc.trim(),
        question_type: secFormType,
        duration_minutes: Number(secFormDuration) || 30,
        total_marks: Number(secFormMarks) || 30,
        question_limit: secFormQuestionLimit ? Number(secFormQuestionLimit) : undefined,
        navigation_mode: secFormNavMode,
        lock_after_submission: secFormLockAfter,
        allow_previous_section: secFormAllowPrev,
        order_number: sections.length + 1,
      };
      setSections((prev) => [...prev, newSec]);
    }

    setIsSectionModalOpen(false);
  };

  const handleDeleteSection = (id: string) => {
    if (sections.length <= 1) {
      alert('A sectional assessment requires at least 1 section.');
      return;
    }
    const updated = sections.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order_number: idx + 1 }));
    setSections(updated);
  };

  const handleDuplicateSection = (sec: SectionDraft) => {
    const copy: SectionDraft = {
      ...sec,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${sec.name} (Copy)`,
      order_number: sections.length + 1,
    };
    setSections((prev) => [...prev, copy]);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((s, i) => (s.order_number = i + 1));
    setSections(reordered);
  };

  // Auto calculate sum of section duration and marks
  const totalSectionDuration = sections.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalSectionMarks = sections.reduce((acc, s) => acc + s.total_marks, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (examType === 'SECTIONAL' && sections.length === 0) {
      setError('Please add at least one section to your Sectional Exam.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const finalDuration = examType === 'SECTIONAL' ? totalSectionDuration : Number(duration);
      const finalTotalMarks = examType === 'SECTIONAL' ? totalSectionMarks : Number(totalMarks);

      const res = await fetch(`${BACKEND_URL}/api/admin/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          exam_type: examType,
          passkey: passkey.trim(),
          duration_minutes: finalDuration,
          total_marks: finalTotalMarks,
          max_violations: Number(maxViolations),
          status: 'DRAFT',
          allowed_languages: ['java', 'c++', 'python', 'c'],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Server returned error status ${res.status}`);
      }

      const newExam = await res.json();

      // If SECTIONAL, create all configured sections for this exam
      if (examType === 'SECTIONAL') {
        for (const sec of sections) {
          await fetch(`${BACKEND_URL}/api/admin/exams/${newExam.id}/sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: sec.name,
              description: sec.description,
              question_type: sec.question_type,
              duration_minutes: sec.duration_minutes,
              total_marks: sec.total_marks,
              question_limit: sec.question_limit,
              navigation_mode: sec.navigation_mode,
              lock_after_submission: sec.lock_after_submission,
              allow_previous_section: sec.allow_previous_section,
              order_number: sec.order_number,
            }),
          });
        }
      }

      navigate(`/admin/exams/${newExam.id}/questions`);
    } catch (err: any) {
      console.error('Failed to create exam:', err);
      setError(err.message || 'Failed to create exam. Could not reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/exams')}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Create Assessment
          </h1>
          <p className="text-xs text-slate-500">
            Configure assessment type, proctoring security, and section architecture
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7 text-xs">
          {/* Exam Type Selector Cards */}
          <div className="space-y-2.5">
            <label className="font-bold text-slate-900 text-sm block">
              Exam Type *
            </label>
            <p className="text-slate-500 text-[11px]">
              Choose the architectural layout for your exam questions and sections:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* 1. Full Exam */}
              <button
                type="button"
                onClick={() => setExamType('FULL')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  examType === 'FULL'
                    ? 'border-[#0B2A5B] bg-blue-50/40 ring-2 ring-[#0B2A5B]/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-[#0B2A5B] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  {examType === 'FULL' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0B2A5B]" />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm">Full Exam</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Flexible general exam containing MCQ and/or coding questions.
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  FULL EXAM
                </span>
              </button>

              {/* 2. MCQ Exam */}
              <button
                type="button"
                onClick={() => setExamType('MCQ')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  examType === 'MCQ'
                    ? 'border-[#0B2A5B] bg-blue-50/40 ring-2 ring-[#0B2A5B]/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-800 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  {examType === 'MCQ' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0B2A5B]" />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm">MCQ Exam</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Multiple choice questions only with automated evaluation.
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MCQ EXAM
                </span>
              </button>

              {/* 3. Coding Exam */}
              <button
                type="button"
                onClick={() => setExamType('CODING')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  examType === 'CODING'
                    ? 'border-[#0B2A5B] bg-blue-50/40 ring-2 ring-[#0B2A5B]/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-800 flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                  {examType === 'CODING' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0B2A5B]" />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm">Coding Exam</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Programming problems executed live via Piston with public and hidden test cases.
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  CODING EXAM
                </span>
              </button>

              {/* 4. Sectional Exam */}
              <button
                type="button"
                onClick={() => setExamType('SECTIONAL')}
                className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                  examType === 'SECTIONAL'
                    ? 'border-[#0B2A5B] bg-blue-50/40 ring-2 ring-[#0B2A5B]/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-900 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  {examType === 'SECTIONAL' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0B2A5B]" />
                  )}
                </div>
                <div className="font-bold text-slate-900 text-sm">Sectional Exam</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Structured multi-stage assessment (e.g. Aptitude, Technical, Coding).
                </p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  SECTIONAL EXAM
                </span>
              </button>
            </div>

            {/* Question Type Notice Banner */}
            {examType === 'MCQ' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Question Type: MCQ only</span>
                <span className="text-[11px] text-emerald-700 ml-auto">
                  Automatically initializes single default MCQ section
                </span>
              </div>
            )}
            {examType === 'CODING' && (
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-800 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-semibold">Question Type: Coding only</span>
                <span className="text-[11px] text-purple-700 ml-auto">
                  Automatically initializes single default Coding section
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Exam Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Anveshana University Campus Placement Assessment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              placeholder="Provide instructions, sections breakdown, and guidelines for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
            />
          </div>

          {/* Passkey */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <label className="font-bold text-amber-900 text-sm block">Exam Passkey (4 Digits)</label>
            <p className="text-amber-800/80 leading-relaxed text-[11px]">
              Students will enter this passkey to verify and begin their proctored exam.
            </p>
            <div className="flex items-center gap-3">
              <div className="font-mono text-2xl font-extrabold text-[#0B2A5B] bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-xs tracking-widest">
                {passkey}
              </div>
              <button
                type="button"
                onClick={() => setPasskey(generatePasskey())}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                Duration (Minutes) {examType === 'SECTIONAL' && <span className="text-[10px] text-slate-400 font-normal">(Sum of sections)</span>}
              </label>
              <input
                type="number"
                min="5"
                max="600"
                disabled={examType === 'SECTIONAL'}
                value={examType === 'SECTIONAL' ? totalSectionDuration : duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#0B2A5B] ${
                  examType === 'SECTIONAL' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'border-slate-200'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">
                Total Marks {examType === 'SECTIONAL' && <span className="text-[10px] text-slate-400 font-normal">(Sum of sections)</span>}
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                disabled={examType === 'SECTIONAL'}
                value={examType === 'SECTIONAL' ? totalSectionMarks : totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#0B2A5B] ${
                  examType === 'SECTIONAL' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'border-slate-200'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Max Violations Allowed</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxViolations}
                onChange={(e) => setMaxViolations(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>
          </div>

          {/* Section Builder (Shown when SECTIONAL Exam is chosen) */}
          {examType === 'SECTIONAL' && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0B2A5B]" />
                    <span>Section Builder</span>
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Configure independent stages, question types, navigation rules, and timers
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddSectionModal}
                  className="px-4 py-2 rounded-xl bg-[#0B2A5B] text-white hover:bg-[#123773] font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                {sections.map((sec, index) => (
                  <div
                    key={sec.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#0B2A5B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {sec.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                sec.question_type === 'MCQ'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sec.question_type === 'CODING'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {sec.question_type}
                            </span>
                          </div>
                          {sec.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {sec.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleMoveSection(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSectionModal(sec)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateSection(sec)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Section Spec Badges */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{sec.duration_minutes}</strong> mins
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <strong>{sec.total_marks}</strong> marks
                      </span>
                      <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
                        Navigation: <strong>{sec.navigation_mode}</strong>
                      </span>
                      {sec.lock_after_submission && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          Locks after submit
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Section Dotted Button */}
              <button
                type="button"
                onClick={openAddSectionModal}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-600 hover:border-[#0B2A5B] hover:text-[#0B2A5B] hover:bg-blue-50/30 transition flex items-center justify-center gap-2 font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Section</span>
              </button>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating Assessment...' : 'Create Exam & Configure Questions →'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Add / Edit Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {editingSectionId ? 'Edit Section' : 'Create Section'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure question type, duration, marks, and section lock behavior
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Section Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantitative Aptitude"
                  value={secFormName}
                  onChange={(e) => setSecFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Section Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide instructions and subject scope for this section..."
                  value={secFormDesc}
                  onChange={(e) => setSecFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Question Type *</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['MCQ', 'CODING', 'MIXED'] as SectionQuestionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSecFormType(t)}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs transition cursor-pointer text-center ${
                        secFormType === t
                          ? 'border-[#0B2A5B] bg-blue-50 text-[#0B2A5B]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Section Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={secFormDuration}
                    onChange={(e) => setSecFormDuration(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Section Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={secFormMarks}
                    onChange={(e) => setSecFormMarks(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2A5B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Navigation Mode</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSecFormNavMode('FREE')}
                    className={`py-2 px-3 rounded-xl border font-semibold text-xs transition cursor-pointer text-center ${
                      secFormNavMode === 'FREE'
                        ? 'border-[#0B2A5B] bg-blue-50 text-[#0B2A5B]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Free Navigation
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecFormNavMode('SEQUENTIAL')}
                    className={`py-2 px-3 rounded-xl border font-semibold text-xs transition cursor-pointer text-center ${
                      secFormNavMode === 'SEQUENTIAL'
                        ? 'border-[#0B2A5B] bg-blue-50 text-[#0B2A5B]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Sequential
                  </button>
                </div>
              </div>

              {/* Toggles for lock & allow previous */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Lock Section After Submission
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Prevents students from returning after submitting this section
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secFormLockAfter}
                      onChange={(e) => setSecFormLockAfter(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B2A5B]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Allow Previous Section Return
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Permits navigating backwards if not locked
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secFormAllowPrev}
                      onChange={(e) => setSecFormAllowPrev(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B2A5B]"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B2A5B] text-white hover:bg-[#123773] font-bold cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
