import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Eye, RefreshCw, Search, MonitorOff, Copy, ArrowRightLeft } from 'lucide-react';
import { SecurityEvent } from '../../types';
import { AdminExamFilter } from '../../components/AdminExamFilter';

export const AdminSecurityLogs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const examId = searchParams.get('examId') || 'all';

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSecurityEvents = useCallback(() => {
    setLoading(true);
    const url = examId === 'all' ? '/api/admin/security' : `/api/admin/exams/${examId}/security`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [examId]);

  useEffect(() => {
    fetchSecurityEvents();
    const interval = setInterval(fetchSecurityEvents, 4000);
    return () => clearInterval(interval);
  }, [fetchSecurityEvents]);

  const handleSelectExam = (newExamId: string) => {
    if (newExamId === 'all') {
      searchParams.delete('examId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ examId: newExamId });
    }
  };

  const getSeverityBadge = (type: string) => {
    switch (type) {
      case 'FULLSCREEN_EXIT':
      case 'TAB_SWITCH':
        return <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">HIGH</span>;
      case 'DEVTOOLS_ATTEMPT':
      case 'COPY_ATTEMPT':
      case 'PASTE_ATTEMPT':
      case 'CUT_ATTEMPT':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">MEDIUM</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">LOW</span>;
    }
  };

  const filteredEvents = events.filter((ev) => {
    const term = search.toLowerCase();
    return (
      ev.student_name?.toLowerCase().includes(term) ||
      ev.roll_number?.toLowerCase().includes(term) ||
      ev.event_type?.toLowerCase().includes(term) ||
      ev.details?.toLowerCase().includes(term)
    );
  });

  const totalIncidents = events.length;
  const tabSwitches = events.filter((e) => e.event_type === 'TAB_SWITCH').length;
  const fullscreenExits = events.filter((e) => e.event_type === 'FULLSCREEN_EXIT').length;
  const clipboardAttempts = events.filter((e) => e.event_type.includes('COPY') || e.event_type.includes('PASTE')).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Real-time record of browser integrity violations, tab switches, and clipboard events
          </p>
        </div>

        <AdminExamFilter
          selectedExamId={examId}
          onSelectExam={handleSelectExam}
          onRefresh={fetchSecurityEvents}
          loading={loading}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalIncidents}</div>
            <div className="text-[11px] text-slate-400 font-medium">Total Violations</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{tabSwitches}</div>
            <div className="text-[11px] text-slate-400 font-medium">Tab Switches</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MonitorOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{fullscreenExits}</div>
            <div className="text-[11px] text-slate-400 font-medium">Fullscreen Exits</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B2A5B] flex items-center justify-center">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{clipboardAttempts}</div>
            <div className="text-[11px] text-slate-400 font-medium">Clipboard Interceptions</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Filter security events by student, roll number, or violation type..."
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

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Violation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No security violations recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'No events matched your search' : 'Integrity monitoring is active. Violations will trigger live alerts here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {ev.student_name || 'Student'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {ev.roll_number || ev.participant_id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#0B2A5B] bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(ev.event_type)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-md truncate" title={ev.details}>
                      {ev.details}
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
