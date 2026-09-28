import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Copy, Check, Save, ArrowLeft } from 'lucide-react';

export const AdminCreateExam: React.FC = () => {
  const navigate = useNavigate();

  const generatePasskey = () => String(Math.floor(1000 + Math.random() * 9000));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [totalMarks, setTotalMarks] = useState('100');
  const [maxViolations, setMaxViolations] = useState('3');
  const [passkey, setPasskey] = useState(generatePasskey());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(passkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          passkey,
          duration_minutes: Number(duration),
          total_marks: Number(totalMarks),
          max_violations: Number(maxViolations),
          status: 'DRAFT',
          allowed_languages: ['java', 'c++', 'python', 'c'],
        }),
      });
      if (res.ok) {
        const newExam = await res.json();
        navigate(`/admin/exams/${newExam.id}/questions`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/exams')}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Create Coding Assessment
          </h1>
          <p className="text-xs text-slate-500">
            Configure an official university exam and generate a secure 4-digit passkey
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Exam Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Anveshana Advanced Algorithms Contest"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Description</label>
            <textarea
              rows={3}
              placeholder="Brief details about problem topics, eligibility, or rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
            />
          </div>

          {/* Passkey Generator Section (Requirement 19) */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <label className="font-bold text-slate-800 text-xs block">
              Exam Passkey (4 Digits)
            </label>
            <p className="text-slate-500 text-[11px]">
              Students will enter this passkey to verify and begin their proctored exam.
            </p>
            <div className="flex items-center gap-3">
              <div className="font-mono text-2xl font-extrabold text-[#0B2A5B] bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-xs tracking-widest">
                {passkey}
              </div>
              <button
                type="button"
                onClick={() => setPasskey(generatePasskey())}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Regenerate</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                min="10"
                max="300"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Total Marks</label>
              <input
                type="number"
                min="10"
                max="500"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Max Violations Allowed</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxViolations}
                onChange={(e) => setMaxViolations(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0B2A5B]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2"
            >
              <span>{loading ? 'Creating...' : 'Create Exam & Add Questions →'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
