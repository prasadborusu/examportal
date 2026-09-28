import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Question, Exam } from '../../types';

export const AdminExamQuestions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPasskey, setShowPasskey] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      const [examRes, questionsRes] = await Promise.all([
        fetch(`/api/admin/exams/${examId}`),
        fetch(`/api/admin/exams/${examId}/questions`),
      ]);

      if (examRes.ok) {
        const examData = await examRes.json();
        setExam(examData);
      }
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        // Sort by order_number
        questionsData.sort((a: any, b: any) => a.order_number - b.order_number);
        setQuestions(questionsData);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              {questions.length} Added
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

      {/* Questions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Configured Coding Problems ({questions.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Drag or use arrows to change the presentation order in the student interface
            </p>
          </div>
          <Link
            to={`/admin/exams/${examId}/questions/new`}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </Link>
        </div>

        {/* Empty State */}
        {questions.length === 0 ? (
          <div className="py-16 px-6 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B2A5B] mx-auto">
              <FileCode className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No questions added yet.</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your first coding question to build this assessment. You can add as many questions as needed and configure both public and hidden test cases.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to={`/admin/exams/${examId}/questions/new`}
                className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add First Question</span>
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
                  <th className="py-3 px-4">Problem Statement</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Test Cases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q, idx) => {
                  const testCases = q.test_cases || [];
                  const hiddenCount = testCases.filter((tc: any) => tc.is_hidden || tc.type === 'HIDDEN').length;
                  const publicCount = testCases.length - hiddenCount;

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

                      {/* Question Details */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/exams/${examId}/questions/${q.id}/edit`}
                            className="font-bold text-slate-900 hover:text-[#0B2A5B] text-sm block"
                          >
                            {q.title}
                          </Link>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                            {q.description}
                          </p>
                        </div>
                      </td>

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

                      {/* Test Cases Pill */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">{testCases.length} Total</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-medium">{publicCount} Public</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-purple-700 font-medium">{hiddenCount} Hidden</span>
                        </div>
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
                            title="Edit Problem"
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
                            title="Delete Problem"
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

      {/* Delete Confirmation Modal */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Question?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong>"{questionToDelete.title}"</strong>? This will permanently remove its configured starter code and test cases.
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
    </div>
  );
};
