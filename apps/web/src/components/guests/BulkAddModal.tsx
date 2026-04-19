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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-green-900 border border-green-800 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-800 bg-green-950/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gold-400" />
            <h2 className="text-green-50 font-semibold tracking-wide uppercase text-sm">Bulk Add Guests</h2>
          </div>
          <button onClick={onClose} className="text-green-600 hover:text-green-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-green-400 mb-1.5">
                Paste guest list{' '}
                <span className="text-green-700 font-normal normal-case tracking-normal">(one per line: Name, Mobile, Table)</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setResult(null); }}
                placeholder={PLACEHOLDER}
                rows={8}
                className="w-full px-3 py-2 bg-green-950 border border-green-700 text-green-50 placeholder-green-800 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-600 resize-none"
              />
              <p className="text-xs text-green-700 mt-1">
                Format: <code className="bg-green-950 px-1">Full Name, +919XXXXXXXXX, TableNumber</code>
              </p>
            </div>

            {/* Live preview */}
            {lines.length > 0 && !result && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-2">{lines.length} guest(s) detected:</p>
                <div className="border border-green-800 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-green-950 text-green-500 uppercase tracking-widest">
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Mobile</th>
                        <th className="px-3 py-2 text-left">Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((row, i) => (
                        <tr key={i} className="border-t border-green-800 text-green-300">
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
                className="flex-1 px-4 py-2 bg-green-950 hover:bg-green-800 border border-green-700 text-sm text-green-300 transition-colors"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && (
                <button
                  type="submit"
                  disabled={loading || lines.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-60 text-sm text-green-950 font-semibold uppercase tracking-widest transition-colors"
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
