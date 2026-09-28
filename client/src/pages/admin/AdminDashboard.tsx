import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode,
  Users,
  Send,
  ShieldAlert,
  Plus,
  ArrowRight,
  ExternalLink,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Exam } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B2A5B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Overview of coding assessments and participant activity
          </p>
        </div>

        <Link
          to="/admin/exams/create"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Exam</span>
        </Link>
      </div>

      {/* 4 Stat Cards (Matches reference image) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Exams */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">Total Exams</div>
          <div className="text-3xl font-extrabold text-[#2563EB] mt-2 font-display">
            {stats?.totalExams ?? 0}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">Students</div>
          <div className="text-3xl font-extrabold text-[#10B981] mt-2 font-display">
            {stats?.totalStudents ?? 0}
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">Submissions</div>
          <div className="text-3xl font-extrabold text-[#F59E0B] mt-2 font-display">
            {stats?.totalSubmissions ?? 0}
          </div>
        </div>

        {/* Violations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500">Violations</div>
          <div className="text-3xl font-extrabold text-[#EF4444] mt-2 font-display">
            {stats?.totalViolations ?? 0}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Exams (Left) + Top Performers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Exams Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Recent Exams
            </h2>
            <Link
              to="/admin/exams"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-4">Passkey</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentExams && stats.recentExams.length > 0 ? (
                  stats.recentExams.map((exam: Exam, idx: number) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {exam.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B2A5B]">
                        {exam.passkey || '••••'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {exam.duration_minutes} Min
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            exam.status === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : exam.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {exam.status === 'LIVE' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          {exam.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {exam.id === 'exam-dsa-2026' ? '124' : exam.id === 'exam-practice-test' ? '56' : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/exams`}
                          className="text-[#2563EB] font-semibold hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No exams configured yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers Table (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">
              Top Performers
            </h2>
            <Link
              to="/admin/results"
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {stats?.topPerformers && stats.topPerformers.length > 0 ? (
                  stats.topPerformers.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.rollNumber}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0B2A5B]">
                        {p.score}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No submissions recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
