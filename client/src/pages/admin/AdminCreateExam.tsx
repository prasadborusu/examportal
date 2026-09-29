import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Copy, Check, Save, ArrowLeft, AlertTriangle, Loader2, Link2 } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [backendUrlInput, setBackendUrlInput] = useState(
    () => localStorage.getItem('ANVESHANA_API_URL') || (import.meta.env.VITE_API_URL || 'https://examportal-a5f9.onrender.com')
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(passkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBackendUrl = (urlToSave?: string) => {
    const val = (urlToSave || backendUrlInput).trim().replace(/\/+$/, '');
    if (!val) {
      localStorage.removeItem('ANVESHANA_API_URL');
      setError('Cleared custom backend URL. Reverted to default.');
      return;
    }
    localStorage.setItem('ANVESHANA_API_URL', val);
    setError(null);
    // Trigger submission with new URL
    handleSubmitDirect(val);
  };

  const handleSubmitDirect = async (overrideUrl?: string) => {
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const baseUrl =
        overrideUrl ||
        localStorage.getItem('ANVESHANA_API_URL') ||
        (import.meta.env.VITE_API_URL || 'https://examportal-a5f9.onrender.com').trim().replace(/\/+$/, '');
      const endpoint = `${baseUrl}/api/admin/exams`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          passkey: passkey.trim(),
          duration_minutes: Number(duration),
          total_marks: Number(totalMarks),
          max_violations: Number(maxViolations),
          status: 'DRAFT',
          allowed_languages: ['java', 'c++', 'python', 'c'],
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Received HTML instead of JSON from server. Your Vercel frontend is not yet connected to your Render backend API.'
        );
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Server returned error status ${res.status}`);
      }

      const newExam = await res.json();
      navigate(`/admin/exams/${newExam.id}/questions`);
    } catch (err: any) {
      console.error('Failed to create exam:', err);
      setError(err.message || 'Failed to create exam. Could not reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitDirect();
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Backend Connection Error Banner & Direct URL Connector */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Backend Connection Notice</span>
            </div>
            <p className="leading-relaxed opacity-90">{error}</p>
            <div className="p-3 bg-white rounded-xl border border-rose-200/80 space-y-2">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Render Backend API URL:</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  placeholder="https://anveshana-backend.onrender.com"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  className="flex-1 w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleSaveBackendUrl()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0B2A5B] text-white font-bold hover:bg-blue-900 transition whitespace-nowrap cursor-pointer text-xs"
                >
                  Save & Connect
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Tip: Paste your Render web service URL here. It will save to your browser and connect immediately without requiring a redeploy.
              </p>
            </div>
          </div>
        )}

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
              className="px-6 py-2.5 rounded-xl font-bold bg-[#0B2A5B] text-white hover:bg-[#123773] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating Assessment...' : 'Create Exam & Add Questions →'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
