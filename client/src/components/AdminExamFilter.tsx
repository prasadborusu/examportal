import React, { useEffect, useState } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { Exam } from '../types';

interface AdminExamFilterProps {
  selectedExamId: string;
  onSelectExam: (examId: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  title?: string;
}

export const AdminExamFilter: React.FC<AdminExamFilterProps> = ({
  selectedExamId,
  onSelectExam,
  onRefresh,
  loading = false,
  title = 'Filter Assessment:',
}) => {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetch('/api/admin/exams')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExams(data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-500 font-medium">{title}</span>
        <select
          value={selectedExamId}
          onChange={(e) => onSelectExam(e.target.value)}
          className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer pr-2"
        >
          <option value="all">All Assessments ({exams.length})</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.status})
            </option>
          ))}
        </select>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs disabled:opacity-50 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0B2A5B]' : ''}`} />
        </button>
      )}
    </div>
  );
};
