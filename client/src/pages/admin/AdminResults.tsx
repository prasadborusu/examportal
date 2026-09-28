import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search, Award, Filter, FileSpreadsheet, Trophy, CheckCircle, Clock } from 'lucide-react';
import { ExamResult } from '../../types';
import { AdminExamFilter } from '../../components/AdminExamFilter';

export const AdminResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 'all';

  const [results, setResults] = useState<ExamResult[]>([]);
  const [search, setSearch] = useState('');
  const [filterMinScore, setFilterMinScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(() => {
    setLoading(true);
    const url = examId === 'all' ? '/api/admin/results' : `/api/admin/exams/${examId}/results`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setResults(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  const handleSelectExam = (newExamId: string) => {
    if (newExamId === 'all') {
      searchParams.delete('examId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ examId: newExamId });
    }
  };

  const filteredResults = results.filter((r) => {
    const term = search.toLowerCase();
    const matchesSearch =
      r.student_name?.toLowerCase().includes(term) ||
      r.roll_number?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.exam_title?.toLowerCase().includes(term);
    const matchesScore = r.total_score >= filterMinScore;
    return matchesSearch && matchesScore;
  });

  const exportCSV = () => {
    const headers = ['Rank', 'Name', 'Roll Number', 'Email', 'Assessment', 'Score', 'Total Marks', 'Passed Cases', 'Time Taken (s)', 'Violations', 'Submitted At'];
    const rows = filteredResults.map((r, i) => [
      i + 1,
      `"${r.student_name}"`,
      r.roll_number,
      r.email,
      `"${r.exam_title || 'Coding Exam'}"`,
      r.total_score,
      r.total_marks,
      `${r.passed_test_cases}/${r.total_test_cases}`,
      r.time_taken_seconds,
      r.violations_count,
      r.submitted_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Anveshana_Results_${examId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalEvaluated = results.length;
  const topScore = results.length > 0 ? Math.max(...results.map((r) => r.total_score)) : 0;
  const avgScore = results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.total_score, 0) / results.length) : 0;
  const cleanSubmissions = results.filter((r) => r.violations_count === 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Assessment Results & Leaderboard
          </h1>
          <p className="text-xs text-slate-500">
            Export scores, test case performance, and student leaderboard metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminExamFilter
            selectedExamId={examId}
            onSelectExam={handleSelectExam}
            onRefresh={fetchResults}
            loading={loading}
          />

          <button
            onClick={exportCSV}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalEvaluated}</div>
            <div className="text-[11px] text-slate-400 font-medium">Evaluated Candidates</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{topScore} pts</div>
            <div className="text-[11px] text-slate-400 font-medium">Top Score</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{avgScore} pts</div>
            <div className="text-[11px] text-slate-400 font-medium">Average Score</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{cleanSubmissions}</div>
            <div className="text-[11px] text-slate-400 font-medium">Zero-Violation Tests</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B2A5B]"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-slate-400 font-medium">Score Filter:</span>
          <select
            value={filterMinScore}
            onChange={(e) => setFilterMinScore(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium cursor-pointer"
          >
            <option value="0">All Scores</option>
            <option value="5">5+ Points</option>
            <option value="20">20+ Points</option>
            <option value="50">50+ Points</option>
            <option value="80">80+ Points</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Roll Number</th>
                {examId === 'all' && <th className="py-3 px-4">Assessment</th>}
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Passed Cases</th>
                <th className="py-3 px-4">Time Taken</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={examId === 'all' ? 9 : 8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No results recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try adjusting your search criteria' : 'Evaluations and rankings will populate here automatically upon submission'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResults.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {r.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0B2A5B]">
                      {r.roll_number}
                    </td>
                    {examId === 'all' && (
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {r.exam_title || 'Coding Contest'}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-[#0B2A5B]">
                      {r.total_score} <span className="text-xs text-slate-400 font-normal">/ {r.total_marks}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {r.passed_test_cases} / {r.total_test_cases}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {formatSeconds(r.time_taken_seconds || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.violations_count > 0 ? (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          {r.violations_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {r.status || 'SUBMITTED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
