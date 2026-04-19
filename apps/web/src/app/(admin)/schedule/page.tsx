'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CalendarDays, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, statusVariant } from '@/components/ui/Badge';
import type { Schedule } from '@/types';

interface Event { id: string; name: string }

export default function SchedulePage() {
  const [events, setEvents]         = useState<Event[]>([]);
  const [eventId, setEventId]       = useState('');
  const [schedules, setSchedules]   = useState<Schedule[]>([]);
  const [form, setForm]             = useState({ scheduledAt: '', type: 'REMINDER' });
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetch('/api/events').then((r) => r.json()).then((data: Event | Event[]) => {
      const list = Array.isArray(data) ? data : (data && (data as Event).id ? [data as Event] : []);
      setEvents(list);
      if (list.length > 0) setEventId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/schedule?eventId=${eventId}`)
      .then((r) => r.json())
      .then(setSchedules);
  }, [eventId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !form.scheduledAt) { toast.error('Fill in all fields.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/schedule', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eventId, ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to create schedule'); return; }
      toast.success('Schedule created');
      setSchedules((prev) => [...prev, data]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this schedule?')) return;
    const res  = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      toast.success('Schedule cancelled');
      setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: 'CANCELLED' as never } : s));
    } else {
      toast.error(data.error ?? 'Failed to cancel');
    }
  }

  const typeLabels: Record<string, string> = {
    REMINDER:          'Custom Reminder',
    DAY_BEFORE:        '1 Day Before',
    SAME_DAY_MORNING:  'Same Day Morning',
    CUSTOM:            'Custom',
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Schedule Reminders</h1>
        <p className="text-slate-400 text-sm mt-1">
          Set up automatic WhatsApp reminder batches.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader><CardTitle>New Schedule</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Event</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="py-2 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="py-2 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="REMINDER">Custom Reminder</option>
                <option value="DAY_BEFORE">1 Day Before Event</option>
                <option value="SAME_DAY_MORNING">Same Day Morning (9 AM)</option>
                <option value="CUSTOM">Custom Date/Time</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="py-2 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" loading={loading}>Schedule Batch</Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing schedules */}
      <Card>
        <CardHeader><CardTitle>Existing Schedules</CardTitle></CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-slate-500 text-sm">No schedules yet.</p>
          ) : (
            <ul className="space-y-3">
              {schedules.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-brand-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-200 font-medium">
                        {typeLabels[s.type] ?? s.type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(s.scheduledAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      s.status === 'COMPLETED' ? 'success' :
                      s.status === 'FAILED'    ? 'danger'  :
                      s.status === 'CANCELLED' ? 'neutral' : 'warning'
                    }>
                      {s.status}
                    </Badge>
                    {s.status === 'PENDING' && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(s.id)}>
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
