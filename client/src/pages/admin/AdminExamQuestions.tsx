import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Award,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileCode,
  Layers,
  Code2,
  Check,
  Compass,
  Lock,
} from 'lucide-react';
import { Question, Exam, Section, SectionQuestionType, SectionNavigationMode } from '../../types';

export const AdminExamQuestions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPasskey, setShowPasskey] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Section Modal state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [secFormName, setSecFormName] = useState('');
  const [secFormDesc, setSecFormDesc] = useState('');
  const [secFormType, setSecFormType] = useState<SectionQuestionType>('MCQ');
  const [secFormDuration, setSecFormDuration] = useState('30');
  const [secFormMarks, setSecFormMarks] = useState('30');
  const [secFormQuestionLimit, setSecFormQuestionLimit] = useState('');
  const [secFormNavMode, setSecFormNavMode] = useState<SectionNavigationMode>('FREE');
  const [secFormLockAfter, setSecFormLockAfter] = useState(true);
  const [secFormAllowPrev, setSecFormAllowPrev] = useState(true);

  useEffect(() => {
    fetch('/api/admin/exams')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllExams(data);
      })
      .catch(console.error);
  }, []);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchExamAndQuestions = useCallback(async () => {
    if (!examId) return;
    try {
      setLoading(true);
      const [examRes, questionsRes, sectionsRes] = await Promise.all([
        fetch(`/api/admin/exams/${examId}`),
        fetch(`/api/admin/exams/${examId}/questions`),
        fetch(`/api/admin/exams/${examId}/sections`),
      ]);

      if (examRes.ok) {
        const examData = await examRes.json();
        setExam(examData);
      }
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        questionsData.sort((a: any, b: any) => a.order_number - b.order_number);
        setQuestions(questionsData);
      }
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        if (Array.isArray(sectionsData)) {
          sectionsData.sort((a: any, b: any) => a.order_number - b.order_number);
          setSections(sectionsData);
        }
      }
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExamAndQuestions();
  }, [fetchExamAndQuestions]);

  // Section Modal Handlers
  const openAddSectionModal = () => {
    setEditingSection(null);
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

  const openEditSectionModal = (sec: Section) => {
    setEditingSection(sec);
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

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secFormName.trim()) return;

    try {
      setActionLoading(true);
      const payload = {
        name: secFormName.trim(),
        description: secFormDesc.trim(),
        question_type: secFormType,
        duration_minutes: Number(secFormDuration) || 30,
        total_marks: Number(secFormMarks) || 30,
        question_limit: secFormQuestionLimit ? Number(secFormQuestionLimit) : undefined,
        navigation_mode: secFormNavMode,
        lock_after_submission: secFormLockAfter,
        allow_previous_section: secFormAllowPrev,
        order_number: editingSection ? editingSection.order_number : sections.length + 1,
      };

      const url = editingSection
        ? `/api/admin/sections/${editingSection.id}`
        : `/api/admin/exams/${examId}/sections`;
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(editingSection ? 'Section updated' : 'Section created');
        setIsSectionModalOpen(false);
        fetchExamAndQuestions();
      }
    } catch (err) {
      console.error('Failed to save section:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
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
    reordered.forEach((s, idx) => (s.order_number = idx + 1));
    setSections(reordered);

    try {
      await fetch(`/api/admin/exams/${examId}/sections/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds: reordered.map((s) => s.id) }),
      });
      showToast('Section order updated');
    } catch (err) {
      console.error('Failed to reorder sections:', err);
      fetchExamAndQuestions();
    }
  };

  const handleDuplicateSection = async (secId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/sections/${secId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showToast('Section and questions duplicated');
        fetchExamAndQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/sections/${sectionToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Section deleted');
        setSectionToDelete(null);
        if (activeSectionId === sectionToDelete.id) {
          setActiveSectionId('all');
        }
        fetchExamAndQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Total marks calculations
  const totalConfiguredMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  const examTotalMarks = exam?.total_marks || 100;
  const marksDifference = examTotalMarks - totalConfiguredMarks;

  // Reorder API call
  const syncReorder = async (updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
    try {
      const questionIds = updatedQuestions.map((q) => q.id);
      await fetch(`/api/admin/exams/${examId}/questions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds }),
      });
      showToast('Question order updated');
    } catch (err) {
      console.error('Failed to update question order:', err);
      fetchExamAndQuestions();
    }
  };

  // Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...questions];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(index - 1, 0, moved);
    newItems.forEach((q, idx) => (q.order_number = idx + 1));
    syncReorder(newItems);
  };

  // Move Down
  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newItems = [...questions];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(index + 1, 0, moved);
    newItems.forEach((q, idx) => (q.order_number = idx + 1));
    syncReorder(newItems);
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newItems = [...questions];
    const [dragged] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, dragged);
    newItems.forEach((q, idx) => (q.order_number = idx + 1));
    setDraggedIndex(index);
    setQuestions(newItems);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      syncReorder(questions);
    }
    setDraggedIndex(null);
  };

  // Duplicate Question
  const handleDuplicate = async (questionId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/questions/${questionId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Question duplicated successfully');
        fetchExamAndQuestions();
      }
    } catch (err) {
      console.error('Failed to duplicate question:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Question
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/admin/questions/${questionToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Question and test cases deleted');
        setQuestionToDelete(null);
        fetchExamAndQuestions();
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-[#0B2A5B] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading assessment questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B2A5B] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-blue-400/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/exams')}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
            title="Back to Exams"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {exam?.title || 'Assessment Questions'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  exam?.status === 'LIVE' || exam?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : exam?.status === 'DRAFT'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {exam?.status || 'DRAFT'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage coding problems, starter templates, and test cases for this assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {allExams.length > 0 && (
            <select
              value={examId}
              onChange={(e) => navigate(`/admin/exams/${e.target.value}/questions`)}
              className="bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer outline-none hover:border-slate-300 transition"
              title="Switch Assessment"
            >
              {allExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.status})
                </option>
              ))}
            </select>
          )}

          <Link
            to={`/admin/exams/${examId}/questions/new`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </Link>
        </div>
      </div>

      {/* Exam Header Metrics Card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Exam Type */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Type</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  exam?.exam_type === 'MCQ'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : exam?.exam_type === 'CODING'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : exam?.exam_type === 'SECTIONAL'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {exam?.exam_type || 'FULL'} EXAM
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Passkey */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passkey</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-slate-800">
                {showPasskey ? exam?.passkey : '••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title={showPasskey ? 'Hide' : 'Show'}
              >
                {showPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center">
            <Key className="w-4 h-4" />
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-bold text-slate-800 mt-0.5 block">
              {exam?.duration_minutes || 60} mins
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Questions Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
            <span className="text-base font-bold text-slate-800 mt-0.5 block">
              {questions.length} Total
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Total Marks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Marks</span>
            <span className="text-base font-bold text-slate-800 mt-0.5 block">
              {totalConfiguredMarks} / {examTotalMarks}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Section Builder Cards Block (Rendered if SECTIONAL Exam) */}
      {exam?.exam_type === 'SECTIONAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0B2A5B]" />
                <span>SECTIONS ({sections.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Organized stages of this assessment. Reorder with arrows or click to manage section questions.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddSectionModal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Section</span>
            </button>
          </div>

          {/* Section Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sections.map((sec, idx) => {
              const secQuestions = questions.filter((q) => q.section_id === sec.id);
              const secMarks = secQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
              const isActive = activeSectionId === sec.id;

              return (
                <div
                  key={sec.id}
                  className={`p-4 rounded-xl border transition space-y-3 cursor-pointer ${
                    isActive
                      ? 'border-[#0B2A5B] bg-blue-50/30 ring-2 ring-[#0B2A5B]/10 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0B2A5B] text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{sec.name}</span>
                    </div>

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

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                      <strong className="text-slate-800">{secQuestions.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Marks</span>
                      <strong className="text-slate-800">{secMarks} / {sec.total_marks}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                      <strong className="text-slate-800">{sec.duration_minutes} min</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                        title="Move Section Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20"
                        title="Move Section Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditSectionModal(sec)}
                        className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateSection(sec.id)}
                        className="px-2 py-1 rounded text-slate-600 hover:bg-slate-100 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectionToDelete(sec)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Tabs (Shown if exam has sections) */}
      {sections.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveSectionId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeSectionId === 'all'
                ? 'bg-[#0B2A5B] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Questions ({questions.length})
          </button>
          {sections.map((sec, idx) => {
            const count = questions.filter((q) => q.section_id === sec.id).length;
            const isTabActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isTabActive
                    ? 'bg-[#0B2A5B] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>
                  Section {idx + 1}: {sec.name}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                    isTabActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Section Header banner when filtered */}
      {activeSectionId !== 'all' && (
        (() => {
          const currSec = sections.find((s) => s.id === activeSectionId);
          if (!currSec) return null;
          const currSecQuestions = questions.filter((q) => q.section_id === currSec.id);
          const currSecMarks = currSecQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-[#0B2A5B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-blue-200">
                    Section {currSec.order_number}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                    {currSec.question_type}
                  </span>
                </div>
                <h2 className="text-lg font-bold font-display">{currSec.name}</h2>
                <p className="text-xs text-blue-100/80">
                  {currSecQuestions.length} Questions • {currSecMarks} / {currSec.total_marks} Marks • {currSec.duration_minutes} Minutes
                </p>
              </div>

              <Link
                to={`/admin/exams/${examId}/questions/new?sectionId=${currSec.id}`}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#0B2A5B] hover:bg-blue-50 transition flex items-center gap-1.5 shadow-sm self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question to Section</span>
              </Link>
            </div>
          );
        })()
      )}

      {/* Questions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Questions (
              {activeSectionId === 'all'
                ? questions.length
                : questions.filter((q) => q.section_id === activeSectionId).length}
              )
            </h2>
            <p className="text-[11px] text-slate-500">
              Drag or use arrows to change the presentation order in the student interface
            </p>
          </div>
          <Link
            to={`/admin/exams/${examId}/questions/new${
              activeSectionId !== 'all' ? `?sectionId=${activeSectionId}` : ''
            }`}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </Link>
        </div>

        {/* Empty State */}
        {(activeSectionId === 'all'
          ? questions.length === 0
          : questions.filter((q) => q.section_id === activeSectionId).length === 0) ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B2A5B] mx-auto">
              <FileCode className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No questions in this section yet.</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your first question to build this section. You can configure MCQs or Coding problems based on section rules.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to={`/admin/exams/${examId}/questions/new${
                  activeSectionId !== 'all' ? `?sectionId=${activeSectionId}` : ''
                }`}
                className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Question</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Questions List Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Problem / Statement</th>
                  {sections.length > 0 && <th className="py-3 px-4">Section</th>}
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeSectionId === 'all'
                  ? questions
                  : questions.filter((q) => q.section_id === activeSectionId)
                ).map((q, idx) => {
                  const testCases = q.test_cases || [];
                  const hiddenCount = testCases.filter((tc: any) => tc.is_hidden || tc.type === 'HIDDEN').length;
                  const publicCount = testCases.length - hiddenCount;
                  const secObj = sections.find((s) => s.id === q.section_id);

                  return (
                    <tr
                      key={q.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-slate-50/80 transition group ${
                        draggedIndex === idx ? 'opacity-40 bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Drag Handle & Order */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
                          <span className="font-mono font-bold text-slate-500">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </td>

                      {/* Question Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            q.question_type === 'MCQ'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {q.question_type || 'CODING'}
                        </span>
                      </td>

                      {/* Question Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/exams/${examId}/questions/${q.id}/edit`}
                            className="font-bold text-slate-900 hover:text-[#0B2A5B] text-sm block"
                          >
                            {q.title}
                          </Link>
                          {q.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                              {q.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Section */}
                      {sections.length > 0 && (
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {secObj ? secObj.name : 'General'}
                          </span>
                        </td>
                      )}

                      {/* Difficulty */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>

                      {/* Marks */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 text-xs">
                          {q.marks} pts
                        </span>
                      </td>

                      {/* Details: MCQ Options or Test cases */}
                      <td className="py-3.5 px-4">
                        {q.question_type === 'MCQ' ? (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>{q.options?.length || 4} options (1 correct)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="font-semibold text-slate-700">{testCases.length} Total</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-emerald-700 font-medium">{publicCount} Public</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-purple-700 font-medium">{hiddenCount} Hidden</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === questions.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 transition"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <Link
                            to={`/admin/exams/${examId}/questions/${q.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B2A5B] hover:bg-blue-50 transition"
                            title="Edit Question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="Duplicate Question"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setQuestionToDelete(q)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Calculation & Validation Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Total Questions: </span>
              <strong className="text-slate-900">{questions.length}</strong>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <span className="text-slate-400">Configured Marks: </span>
              <strong className="text-slate-900">
                {totalConfiguredMarks} / {examTotalMarks}
              </strong>
            </div>

            {/* Marks Validation Status */}
            <div>
              {marksDifference > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>⚠ {marksDifference} marks remaining</span>
                </span>
              ) : marksDifference === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ Marks complete</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100/70 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>⚠ Total question marks exceed exam total by {Math.abs(marksDifference)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              to={`/admin/exams/${examId}/review`}
              className="px-5 py-2.5 rounded-xl font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 text-xs shadow-xs"
            >
              <span>Review Exam →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Question Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Question?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong>"{questionToDelete.title}"</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteQuestion}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5"
              >
                {actionLoading ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Confirmation Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Section?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete section <strong>"{sectionToDelete.name}"</strong>? Questions inside this section will also be unassigned.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSection}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5"
              >
                {actionLoading ? 'Deleting...' : 'Delete Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {editingSection ? 'Edit Section' : 'Create Section'}
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
                  placeholder="e.g. Technical Assessment"
                  value={secFormName}
                  onChange={(e) => setSecFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Section Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide instructions and scope for this section..."
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

              {/* Toggles */}
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
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#0B2A5B] text-white hover:bg-[#123773] font-bold cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
