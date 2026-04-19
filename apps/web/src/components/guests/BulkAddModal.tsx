'use client';

import { useState } from 'react';
import { X, Users, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDER = `Priya Sharma, +919876543210, T-1
Rahul Verma, +919123456789, T-2
Anita Patel, +918765432109, T-3`;

interface BulkResult {
  added:   number;
  skipped: number;
}

interface Props {
  onClose:  () => void;
  onAdded:  () => void;
}

export function BulkAddModal({ onClose, onAdded }: Props) {
  const [text,    setText]    = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<BulkResult | null>(null);

  // Live preview: parse lines for display
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { name: parts[0] ?? '', mobile: parts[1] ?? '', table: parts[2] ?? '' };
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res  = await fetch('/api/guests/bulk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lines: text }),
      });
      const json: BulkResult & { error?: string } = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Bulk add failed');
        return;
      }

      setResult(json);
      toast.success(`${json.added} guest(s) added!`);
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-brand-400" />
            <h2 className="text-slate-100 font-semibold">Bulk Add Guests</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Paste guest list{' '}
                <span className="text-slate-500 font-normal">(one per line: Name, Mobile, Table)</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setResult(null); }}
                placeholder={PLACEHOLDER}
                rows={8}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: <code className="bg-slate-800 px-1 rounded">Full Name, +919XXXXXXXXX, TableNumber</code>
              </p>
            </div>

            {/* Live preview */}
            {lines.length > 0 && !result && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">{lines.length} guest(s) detected:</p>
                <div className="border border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-800 text-slate-400">
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Mobile</th>
                        <th className="px-3 py-2 text-left">Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((row, i) => (
                        <tr key={i} className="border-t border-slate-800 text-slate-300">
                          <td className="px-3 py-1.5">{row.name || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-1.5">{row.mobile || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-1.5">{row.table || <span className="text-red-400">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex-1">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">{result.added} added</span>
                </div>
                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex-1">
                    <AlertCircle size={16} className="text-amber-400" />
                    <span className="text-amber-300 text-sm font-medium">{result.skipped} updated</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && (
                <button
                  type="submit"
                  disabled={loading || lines.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Importing…' : `Import ${lines.length} Guest${lines.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
