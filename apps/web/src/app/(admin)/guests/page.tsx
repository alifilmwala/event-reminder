'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UserPlus, Users, Download } from 'lucide-react';
import { GuestTable } from '@/components/dashboard/GuestTable';
import { AddGuestModal } from '@/components/guests/AddGuestModal';
import { BulkAddModal } from '@/components/guests/BulkAddModal';
import type { GuestWithStats, PaginatedResponse } from '@/types';

export default function GuestsPage() {
  const [data,         setData]         = useState<PaginatedResponse<GuestWithStats> | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [query,        setQuery]        = useState('');
  const [status,       setStatus]       = useState('ALL');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showBulk,     setShowBulk]     = useState(false);
  const debounceRef                     = useRef<ReturnType<typeof setTimeout>>();

  const fetchGuests = useCallback(
    async (p: number, q: string, s: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:     String(p),
          pageSize: '20',
          status:   s,
          ...(q ? { query: q } : {}),
        });
        const res  = await fetch(`/api/guests?${params}`);
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchGuests(page, query, status);
  }, [page, status, fetchGuests]);

  function handleSearch(q: string) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(q);
      setPage(1);
      void fetchGuests(1, q, status);
    }, 300);
  }

  function handleStatusFilter(s: string) {
    setStatus(s);
    setPage(1);
  }

  function handleRefresh() {
    void fetchGuests(page, query, status);
  }

  async function handleExportCsv() {
    // Fetch all guests (no pagination) for CSV export
    const res  = await fetch('/api/guests?page=1&pageSize=9999&status=ALL');
    const json = await res.json() as PaginatedResponse<GuestWithStats>;

    const rows = [
      ['Name', 'Mobile', 'Table', 'Status', 'Sent At', 'Link Visited', 'Added'],
      ...json.data.map((g) => [
        g.name,
        g.mobile,
        g.tableNumber,
        g.latestMessage?.status ?? 'PENDING',
        g.latestMessage?.sentAt ?? '',
        g.linkVisited ? 'Yes' : 'No',
        new Date(g.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv  = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `guests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-50 uppercase tracking-widest">Guests</h1>
          <p className="text-brand-600/70 text-xs mt-1 tracking-wider uppercase">
            Manage all guests and their WhatsApp reminder status.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-surface-border rounded text-xs text-forest-300 uppercase tracking-wider transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-surface-border rounded text-xs text-forest-300 uppercase tracking-wider transition-colors"
          >
            <Users size={14} />
            Bulk Add
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-400 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors"
          >
            <UserPlus size={14} />
            Add Guest
          </button>
        </div>
      </div>

      <GuestTable
        guests={(data?.data ?? []) as GuestWithStats[]}
        total={data?.total ?? 0}
        page={page}
        pageSize={20}
        onPageChange={setPage}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      {showAdd && (
        <AddGuestModal
          onClose={() => setShowAdd(false)}
          onAdded={handleRefresh}
        />
      )}

      {showBulk && (
        <BulkAddModal
          onClose={() => setShowBulk(false)}
          onAdded={handleRefresh}
        />
      )}
    </div>
  );
}

