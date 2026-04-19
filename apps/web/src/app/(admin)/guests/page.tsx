'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UserPlus, Users, Download, Smartphone } from 'lucide-react';
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
  const [showGroups,   setShowGroups]   = useState(false);
  const [groupsData,   setGroupsData]   = useState<Array<{ name: string; tableNumber: string | null; memberCount: number }> | null>(null);
  const [groupsError,  setGroupsError]  = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsImporting, setGroupsImporting] = useState(false);
  const [groupsResult, setGroupsResult] = useState<{ added: number; updated: number } | null>(null);
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

  async function handleOpenGroups() {
    setShowGroups(true);
    setGroupsResult(null);
    setGroupsError(null);
    setGroupsData(null);
    setGroupsLoading(true);
    try {
      const res  = await fetch('/api/guests/import-groups');
      const json = await res.json() as { groups?: Array<{ name: string; tableNumber: string | null; memberCount: number }>; error?: string };
      if (!res.ok || json.error) {
        setGroupsError(json.error ?? 'Failed to fetch groups.');
      } else {
        setGroupsData(json.groups ?? []);
      }
    } catch {
      setGroupsError('Could not reach the WhatsApp service.');
    } finally {
      setGroupsLoading(false);
    }
  }

  async function handleImportGroups() {
    setGroupsImporting(true);
    try {
      const res  = await fetch('/api/guests/import-groups', { method: 'POST' });
      const json = await res.json() as { added: number; updated: number };
      setGroupsResult(json);
      handleRefresh();
    } finally {
      setGroupsImporting(false);
    }
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
            onClick={() => void handleOpenGroups()}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-surface-border rounded text-xs text-forest-300 uppercase tracking-wider transition-colors"
          >
            <Smartphone size={14} />
            Import Groups
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

      {showGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-surface border border-surface-border rounded-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-50">Import from WhatsApp Groups</h2>

            {groupsLoading && (
              <p className="text-xs text-forest-400 animate-pulse">Fetching groups…</p>
            )}

            {!groupsLoading && groupsError && (
              <div className="space-y-2">
                <p className="text-xs text-red-400">{groupsError}</p>
                <p className="text-xs text-forest-500">Go to the <a href="/dashboard/whatsapp" className="text-brand-400 underline">WhatsApp page</a> and scan the QR code to reconnect.</p>
                <div className="flex justify-end pt-1">
                  <button onClick={() => setShowGroups(false)} className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 transition-colors uppercase tracking-wider">Close</button>
                </div>
              </div>
            )}

            {!groupsLoading && !groupsError && groupsData && groupsData.length === 0 && (
              <p className="text-xs text-red-400">No groups found on this WhatsApp account.</p>
            )}

            {!groupsLoading && groupsData && groupsData.length > 0 && !groupsResult && (
              <>
                <p className="text-xs text-forest-400">The following groups were found. Groups with a number in the name will be imported.</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {groupsData.map((g) => (
                    <div key={g.name} className="flex items-center justify-between py-1.5 px-2 rounded bg-surface-hover text-xs">
                      <span className={g.tableNumber ? 'text-green-200' : 'text-forest-500 line-through'}>{g.name}</span>
                      <span className="text-forest-400">
                        {g.tableNumber ? `Thaal ${g.tableNumber} · ${g.memberCount} members` : 'skipped (no number)'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowGroups(false)}
                    className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 transition-colors uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleImportGroups()}
                    disabled={groupsImporting}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors"
                  >
                    {groupsImporting ? 'Importing…' : 'Import All'}
                  </button>
                </div>
              </>
            )}

            {groupsResult && (
              <>
                <p className="text-xs text-green-300">
                  Import complete — <strong>{groupsResult.added}</strong> new guests added, <strong>{groupsResult.updated}</strong> updated.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowGroups(false)}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

