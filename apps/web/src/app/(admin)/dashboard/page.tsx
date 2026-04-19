'use client';

import { useEffect, useState } from 'react';
import { Users, Send, Clock, AlertTriangle, Link2 } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DashboardStats } from '@/types';

function BarChart({ data }: { data: { day: string; sent: number }[] }) {
  if (!data.length) return <p className="text-slate-500 text-sm">No send activity yet.</p>;
  const max = Math.max(...data.map((d) => d.sent), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-brand-500/60 rounded-t"
            style={{ height: `${(d.sent / max) * 88}px`, minHeight: 4 }}
          />
          <span className="text-[10px] text-slate-500">
            {new Date(d.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats & { recentActivity: { day: string; sent: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const s = stats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-green-50 uppercase tracking-widest">Dashboard</h1>
        <p className="text-brand-600/70 text-xs mt-1 tracking-wider uppercase">Overview of all guest reminders</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Guests"
          value={loading ? '—' : (s?.totalGuests ?? 0)}
          icon={Users}
          iconColor="text-brand-400"
        />
        <StatsCard
          title="Sent"
          value={loading ? '—' : (s?.sentCount ?? 0)}
          icon={Send}
          iconColor="text-forest-400"
        />
        <StatsCard
          title="Pending"
          value={loading ? '—' : (s?.pendingCount ?? 0)}
          icon={Clock}
          iconColor="text-brand-300"
        />
        <StatsCard
          title="Failed"
          value={loading ? '—' : (s?.failedCount ?? 0)}
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Send Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 bg-slate-700/30 rounded animate-pulse" />
            ) : (
              <BarChart data={(s?.recentActivity ?? []).map((r) => ({ day: r.day as unknown as string, sent: r.sent }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Link2 size={15} className="text-brand-400" />
                Links opened
              </div>
              <span className="text-slate-100 font-bold">
                {loading ? '—' : (s?.linkVisitedCount ?? 0)}
              </span>
            </div>
            {!loading && s && s.totalGuests > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Open rate</span>
                  <span>{Math.round((s.linkVisitedCount / s.totalGuests) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${(s.linkVisitedCount / s.totalGuests) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Delivery rate</span>
              <span className="text-slate-100 font-bold">
                {loading || !s || s.totalGuests === 0
                  ? '—'
                  : `${Math.round((s.sentCount / s.totalGuests) * 100)}%`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
