'use client';

import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export function AddGuestModal({ onClose, onAdded }: Props) {
  const [name,        setName]        = useState('');
  const [mobile,      setMobile]      = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res  = await fetch('/api/guests', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), mobile: mobile.trim(), tableNumber: tableNumber.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        const detail = json?.details?.fieldErrors
          ? Object.values(json.details.fieldErrors).flat().join(', ')
          : json?.error ?? 'Failed to add guest';
        toast.error(detail);
        return;
      }

      toast.success(`${name.trim()} added successfully!`);
      onAdded();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-brand-400" />
            <h2 className="text-slate-100 font-semibold">Add Guest</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              maxLength={100}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+919876543210"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Include country code (e.g. +91 for India)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Table / Seat Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. T-14"
              required
              maxLength={20}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 rounded-lg text-sm text-white font-medium transition-colors"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Adding…' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
