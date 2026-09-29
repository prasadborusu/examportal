import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, FileCode, CheckCircle, Clock, Search, Copy, Check } from 'lucide-react';
import { Submission } from '../../types';
import { AdminExamFilter } from '../../components/AdminExamFilter';

export const AdminSubmissions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 'all';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    const url = examId === 'all' ? '/api/admin/submissions' : `/api/admin/exams/${examId}/submissions`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, [fetchSubmissions]);

  const handleSelectExam = (newExamId: string) => {
    if (newExamId === 'all') {
      searchParams.delete('examId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ examId: newExamId });
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.student_name?.toLowerCase().includes(term) ||
      s.roll_number?.toLowerCase().includes(term) ||
      s.question_title?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term) ||
      s.language?.toLowerCase().includes(term)
    );
  });

  const handleCopyCode = () => {
    if (!selectedSub?.code) return;
    navigator.clipboard.writeText(selectedSub.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Code Submissions
          </h1>
          <p className="text-xs text-slate-500">
            Live telemetry of evaluated algorithm solutions, runtime latency, and test verdicts
          </p>
        </div>

        <AdminExamFilter
          selectedExamId={examId}
          onSelectExam={handleSelectExam}
          onRefresh={fetchSubmissions}
          loading={loading}
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by student name, roll number, question title, or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-slate-400 hover:text-slate-600 text-xs px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Tests Passed</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Memory</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No submissions recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try adjusting your search criteria' : 'Student code runs will stream in here as submissions are submitted'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{s.student_name || 'Student'}</div>
                      <div className="font-mono text-[11px] text-slate-400">{s.roll_number || s.participant_id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[180px] truncate" title={s.question_title}>
                      {s.question_title || 'Coding Problem'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-700">
                        {s.language}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.status === 'Partial Score'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B2A5B]">
                      {s.score} pts
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {s.passed_test_cases} / {s.total_test_cases}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {s.execution_time_ms || 0} ms
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {s.memory_kb ? Math.round(s.memory_kb / 1024) : 0} MB
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(s.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSub(s)}
                        className="text-[#0B2A5B] hover:text-blue-700 hover:underline font-semibold cursor-pointer"
                      >
                        View Code
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="max-w-3xl w-full bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedSub.student_name} — {selectedSub.question_title} ({(selectedSub.language || 'code').toUpperCase()})
                </h3>
                <span className="text-xs text-slate-500">
                  Status: <strong className="text-slate-800">{selectedSub.status}</strong> • Score: <strong>{selectedSub.score} pts</strong> • Passed: {selectedSub.passed_test_cases}/{selectedSub.total_test_cases}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="bg-[#1E1E1E] text-zinc-100 p-4 rounded-xl text-xs font-mono max-h-[480px] overflow-auto leading-relaxed border border-slate-800">
              {selectedSub.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
