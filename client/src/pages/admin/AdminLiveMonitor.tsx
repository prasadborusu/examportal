import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radio, Users, AlertTriangle, CheckCircle, StopCircle, RefreshCw, ShieldAlert, Search } from 'lucide-react';
import { AdminExamFilter } from '../../components/AdminExamFilter';

export const AdminLiveMonitor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 'all';

  const [metrics, setMetrics] = useState<any>({
    studentsOnline: 0,
    currentlyCoding: 0,
    submitted: 0,
    warnings: 0,
    terminated: 0,
  });
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLiveData = useCallback(() => {
    setLoading(true);
    const url = examId === 'all' ? '/api/admin/live' : `/api/admin/exams/${examId}/live`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
        if (data.participants) setParticipants(data.participants);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 4000); // live polling every 4s
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const handleSelectExam = (newExamId: string) => {
    if (newExamId === 'all') {
      searchParams.delete('examId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ examId: newExamId });
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.rollNumber?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.examTitle?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Live Assessment Monitor
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time participant activity, violations, and submission telemetry
          </p>
        </div>

        <AdminExamFilter
          selectedExamId={examId}
          onSelectExam={handleSelectExam}
          onRefresh={fetchLiveData}
          loading={loading}
        />
      </div>

      {/* 5 Realtime Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Students Online
          </span>
          <span className="text-2xl font-black text-[#2563EB] font-display mt-1 block">
            {metrics.studentsOnline}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Currently Coding
          </span>
          <span className="text-2xl font-black text-[#0B2A5B] font-display mt-1 block">
            {metrics.currentlyCoding}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Submitted
          </span>
          <span className="text-2xl font-black text-emerald-600 font-display mt-1 block">
            {metrics.submitted}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Warnings
          </span>
          <span className="text-2xl font-black text-amber-500 font-display mt-1 block">
            {metrics.warnings}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Terminated
          </span>
          <span className="text-2xl font-black text-rose-600 font-display mt-1 block">
            {metrics.terminated}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter active student sessions..."
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

      {/* Participant Live Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Connected Student Sessions ({filteredParticipants.length})
          </h2>
          <span className="text-[11px] text-slate-400">Auto-polling every 4 seconds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Roll Number</th>
                {examId === 'all' && <th className="py-3 px-4">Assessment</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={examId === 'all' ? 8 : 7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No active student sessions</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Students will appear here in real-time as they connect to the assessment
                    </p>
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {p.rollNumber}
                    </td>
                    {examId === 'all' && (
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {p.examTitle || 'Coding Contest'}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'CODING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.status === 'SUBMITTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'WARNING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status === 'CODING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B2A5B]">
                      {p.score} pts
                    </td>
                    <td className="py-3.5 px-4">
                      {p.violations > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>{p.violations} / 3</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(p.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'CODING' && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`Force finalize submission for ${p.name}?`)) {
                              await fetch(`/api/exam/${p.id}/final-submit`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reason: 'ADMIN_FORCE_SUBMIT' }),
                              });
                              fetchLiveData();
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition cursor-pointer"
                        >
                          Force Submit
                        </button>
                      )}
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
