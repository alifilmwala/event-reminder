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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-green-900 border border-green-800 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-800 bg-green-950/60">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-gold-400" />
            <h2 className="text-green-50 font-semibold tracking-wide uppercase text-sm">Add Guest</h2>
          </div>
          <button onClick={onClose} className="text-green-600 hover:text-green-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-green-400 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              maxLength={100}
              className="w-full px-3 py-2 bg-green-950 border border-green-700 text-green-50 placeholder-green-800 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-green-400 mb-1.5">
              WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+919876543210"
              required
              className="w-full px-3 py-2 bg-green-950 border border-green-700 text-green-50 placeholder-green-800 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-600"
            />
            <p className="text-xs text-green-700 mt-1">Include country code (e.g. +91 for India)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-green-400 mb-1.5">
              Table / Seat Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. T-14"
              required
              maxLength={20}
              className="w-full px-3 py-2 bg-green-950 border border-green-700 text-green-50 placeholder-green-800 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-600"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-green-950 hover:bg-green-800 border border-green-700 text-sm text-green-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-60 text-sm text-green-950 font-semibold uppercase tracking-widest transition-colors"
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
