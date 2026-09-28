import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, ShieldAlert, CheckCircle, Clock, Search } from 'lucide-react';
import { Participant } from '../../types';
import { AdminExamFilter } from '../../components/AdminExamFilter';

export const AdminParticipants: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 'all';

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchParticipants = useCallback(() => {
    setLoading(true);
    const url = examId === 'all' ? '/api/admin/participants' : `/api/admin/exams/${examId}/participants`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setParticipants(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

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
      p.roll_number?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.exam_title?.toLowerCase().includes(term)
    );
  });

  const totalRegistered = participants.length;
  const codingCount = participants.filter((p) => p.status === 'CODING').length;
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED').length;
  const violationsCount = participants.filter((p) => p.violations_count > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Registered Participants
          </h1>
          <p className="text-xs text-slate-500">
            Real-time assessment telemetry, participant statuses, and violation audits
          </p>
        </div>

        <AdminExamFilter
          selectedExamId={examId}
          onSelectExam={handleSelectExam}
          onRefresh={fetchParticipants}
          loading={loading}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalRegistered}</div>
            <div className="text-[11px] text-slate-400 font-medium">Total Participants</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{codingCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Currently Coding</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{submittedCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Completed / Submitted</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{violationsCount}</div>
            <div className="text-[11px] text-slate-400 font-medium">Security Flags</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter by student name, roll number, email, or assessment..."
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

      {/* Participants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Email</th>
                {examId === 'all' && <th className="py-3 px-4">Assessment</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={examId === 'all' ? 8 : 7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No participants found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try adjusting your search criteria' : 'Students will appear here once they verify the assessment passkey'}
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
                      {p.roll_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {p.email}
                    </td>
                    {examId === 'all' && (
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                          {p.exam_title || 'Coding Contest'}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'CODING'
                            ? 'bg-blue-50 text-blue-700'
                            : p.status === 'SUBMITTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'WARNING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.violations_count > 0 ? (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          {p.violations_count}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(p.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono">
                      {p.submitted_at
                        ? new Date(p.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'In Progress'}
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
