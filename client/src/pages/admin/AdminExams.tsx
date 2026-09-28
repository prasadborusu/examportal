import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Copy, Check, Radio, HelpCircle, Users, Award, Trash2 } from 'lucide-react';
import { Exam } from '../../types';

export const AdminExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchExams = () => {
    fetch('/api/admin/exams')
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCopyPasskey = (passkey: string, id: string) => {
    navigator.clipboard.writeText(passkey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (exam: Exam) => {
    const nextStatus = exam.status === 'LIVE' ? 'ENDED' : 'LIVE';
    try {
      await fetch(`/api/admin/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam assessment?')) return;
    try {
      await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Exams Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure coding assessments, passkeys, and question sets
          </p>
        </div>

        <Link
          to="/admin/exams/create"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Exam</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Exam Name</th>
                <th className="py-3 px-4">Passkey</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Marks</th>
                <th className="py-3 px-4">Max Violations</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-4">
                    <Link
                      to={`/admin/exams/${exam.id}/questions`}
                      className="font-bold text-slate-900 hover:text-[#0B2A5B] block text-sm"
                    >
                      {exam.title}
                    </Link>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {exam.description || 'No description provided.'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-slate-100 px-2 py-0.5 rounded text-[#0B2A5B]">
                        {exam.passkey}
                      </span>
                      <button
                        onClick={() => handleCopyPasskey(exam.passkey || '', exam.id)}
                        className="text-slate-400 hover:text-slate-700 transition"
                        title="Copy Passkey"
                      >
                        {copiedId === exam.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {exam.duration_minutes} Minutes
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {exam.total_marks} Marks
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">
                    {exam.max_violations}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleStatus(exam)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        exam.status === 'LIVE' || exam.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : exam.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          : exam.status === 'SCHEDULED'
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {(exam.status === 'LIVE' || exam.status === 'ACTIVE') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span>{exam.status}</span>
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2.5 text-xs">
                      <Link
                        to={`/admin/exams/${exam.id}/questions`}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0B2A5B] hover:bg-blue-100 font-semibold flex items-center gap-1"
                        title="Manage Questions"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Questions</span>
                      </Link>
                      <Link
                        to={`/admin/exams/${exam.id}/review`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold flex items-center gap-1"
                        title="Review Assessment"
                      >
                        <span>Review</span>
                      </Link>
                      <Link
                        to={`/admin/live?examId=${exam.id}`}
                        className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                        title="Live Monitor"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Live</span>
                      </Link>
                      <Link
                        to={`/admin/results?examId=${exam.id}`}
                        className="text-amber-600 hover:underline font-semibold flex items-center gap-1"
                        title="Results"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Results</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
