import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, HelpCircle, Plus } from 'lucide-react';
import { Exam } from '../../types';

export const AdminQuestionBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetch('/api/admin/exams')
      .then((r) => r.json())
      .then((data: Exam[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setExams(data);
          // Look for examId from query param or find first LIVE / ACTIVE exam, or first exam
          const paramId = searchParams.get('examId');
          const targetExam =
            (paramId && data.find((e) => e.id === paramId)) ||
            data.find((e) => e.status === 'LIVE' || e.status === 'ACTIVE') ||
            data[0];

          navigate(`/admin/exams/${targetExam.id}/questions`, { replace: true });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load exams:', err);
        setLoading(false);
      });
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-8 h-8 text-[#0B2A5B] animate-spin" />
        <p className="text-sm font-medium text-slate-500">Opening Question Management Portal...</p>
      </div>
    );
  }

  return (
    <div className="py-20 max-w-lg mx-auto text-center space-y-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center mx-auto">
        <HelpCircle className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">No Assessments Created Yet</h2>
        <p className="text-xs text-slate-500">
          Create an assessment first. Once created, you can add unlimited coding questions, configure starter code, and manage test cases.
        </p>
      </div>
      <Link
        to="/admin/exams/create"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#123773] transition shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span>Create Assessment →</span>
      </Link>
    </div>
  );
};
