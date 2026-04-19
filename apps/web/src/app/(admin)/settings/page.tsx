'use client';

import { useEffect, useState } from 'react';
import { Settings, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import type { EventConfig } from '@/types';

export default function SettingsPage() {
  const [event,   setEvent]   = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Form state
  const [name,        setName]        = useState('');
  const [date,        setDate]        = useState('');
  const [venue,       setVenue]       = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((ev: EventConfig) => {
        setEvent(ev);
        setName(ev.name);
        // Convert ISO to datetime-local input format (YYYY-MM-DDTHH:mm)
        setDate(ev.date.slice(0, 16));
        setVenue(ev.venue ?? '');
        setDescription(ev.description ?? '');
      })
      .catch(() => toast.error('Failed to load event settings'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res  = await fetch('/api/events', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:        name.trim(),
          date:        new Date(date).toISOString(),
          venue:       venue.trim(),
          description: description.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to save');
        return;
      }

      setEvent(json);
      toast.success('Event settings saved!');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Event Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure the event details displayed on guest reminder cards.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} className="text-brand-400" />
          <h2 className="text-slate-200 font-medium text-sm">Event Details</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Event Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={150}
            placeholder="Grand Annual Gala 2026"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Date &amp; Time <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Venue</label>
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            maxLength={200}
            placeholder="The Royal Palace Banquet Hall"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional additional note shown on the guest card…"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 rounded-lg text-sm text-white font-medium transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {event && (
        <p className="text-xs text-slate-500">
          Event ID: <code className="bg-slate-800 px-1 rounded">{event.id}</code>
        </p>
      )}
    </div>
  );
}
