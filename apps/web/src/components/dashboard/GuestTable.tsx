'use client';

import { useState } from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { GuestWithStats } from '@/types';

interface GuestTableProps {
  guests: GuestWithStats[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function GuestTable({
  guests,
  total,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onStatusFilter,
  onRefresh,
  isLoading,
}: GuestTableProps) {
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [shareGuest,  setShareGuest]  = useState<GuestWithStats | null>(null);
  const [copied,      setCopied]      = useState(false);
  const [editGuest,   setEditGuest]   = useState<GuestWithStats | null>(null);
  const [editName,    setEditName]    = useState('');
  const [editTable,   setEditTable]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const totalPages = Math.ceil(total / pageSize);

  function openEdit(g: GuestWithStats) {
    setEditGuest(g);
    setEditName(g.name);
    setEditTable(g.tableNumber);
  }

  async function handleSaveEdit() {
    if (!editGuest) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/guests/${editGuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), tableNumber: editTable.trim() }),
      });
      if (res.ok) {
        toast.success('Guest updated');
        setEditGuest(null);
        onRefresh();
      } else {
        const d = await res.json();
        toast.error(d.error ?? 'Update failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/guests/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Guest deleted');
        setDeleteId(null);
        onRefresh();
      } else {
        const d = await res.json();
        toast.error(d.error ?? 'Delete failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleResend(guestId: string) {
    setResendingId(guestId);
    try {
      const res = await fetch(`/api/guests/${guestId}/resend`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Message queued for resend');
        onRefresh();
      } else {
        toast.error(data.error ?? 'Resend failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600" />
            <input
              type="search"
              placeholder="Search name or mobile…"
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface-muted border border-surface-border rounded text-green-50 placeholder:text-forest-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <select
            onChange={(e) => onStatusFilter(e.target.value)}
            className="py-2 px-3 text-sm bg-surface-muted border border-surface-border rounded text-green-50 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All status</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-forest-500 uppercase tracking-widest">
          <span>{total} guests</span>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-surface-border">
              {['Name', 'Mobile', 'Table', 'Status', 'Sent At', 'Link Opened', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-600/70"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && guests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-forest-700">
                  Loading…
                </td>
              </tr>
            ) : guests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-forest-700">
                  No guests found.
                </td>
              </tr>
            ) : (
              guests.map((g) => {
                const msg = g.latestMessage;
                return (
                  <tr
                    key={g.id}
                    className="border-b border-surface-border hover:bg-surface transition-colors"
                  >
                    <td className="px-4 py-3 text-green-50 font-medium">{g.name}</td>
                    <td className="px-4 py-3 text-forest-400 font-mono text-xs">{g.mobile}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-brand-950/60 text-brand-400 border border-brand-800/50 rounded text-xs font-semibold">
                        {g.tableNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {msg ? (
                        <Badge variant={statusVariant(msg.status)}>{msg.status}</Badge>
                      ) : (
                        <Badge variant="warning">PENDING</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-forest-500 text-xs">
                      {msg?.sentAt ? format(new Date(msg.sentAt), 'dd MMM, HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {g.linkVisited ? (
                        <span className="text-forest-400 text-xs tracking-wider uppercase">✓ Opened</span>
                      ) : (
                        <span className="text-forest-700 text-xs tracking-wider uppercase">Not seen</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          loading={resendingId === g.id}
                          onClick={() => handleResend(g.id)}
                        >
                          Resend
                        </Button>
                        <button
                          title="Share guest card"
                          onClick={() => { setShareGuest(g); setCopied(false); }}
                          className="p-1.5 rounded hover:bg-surface-hover text-forest-400 hover:text-brand-400 transition-colors"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          title="Edit guest"
                          onClick={() => openEdit(g)}
                          className="p-1.5 rounded hover:bg-surface-hover text-forest-400 hover:text-green-200 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          title="Delete guest"
                          onClick={() => setDeleteId(g.id)}
                          className="p-1.5 rounded hover:bg-surface-hover text-forest-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-forest-500 uppercase tracking-wider">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareGuest && (() => {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${shareGuest.token}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="bg-surface border border-surface-border rounded-lg w-full max-w-sm p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-green-50">Share Guest Card</h2>
              <p className="text-xs text-forest-400">Send this link to <span className="text-green-200 font-semibold">{shareGuest.name}</span> — it opens their personalized reminder card.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-surface-muted border border-surface-border rounded text-forest-300 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-brand-500 hover:bg-brand-400 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 underline underline-offset-2 hover:text-brand-300"
                >
                  Preview card ↗
                </a>
                <button onClick={() => setShareGuest(null)} className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 uppercase tracking-wider transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Share modal */}
      {shareGuest && (() => {
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${shareGuest.token}`;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="bg-surface border border-surface-border rounded-lg w-full max-w-sm p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-green-50">Share Guest Card</h2>
              <p className="text-xs text-forest-400">Send this link to <span className="text-green-200 font-semibold">{shareGuest.name}</span> — it opens their personalized reminder card.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-surface-muted border border-surface-border rounded text-forest-300 focus:outline-none"
                />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-brand-500 hover:bg-brand-400 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-400 underline underline-offset-2 hover:text-brand-300"
                >
                  Preview card ↗
                </a>
                <button onClick={() => setShareGuest(null)} className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 uppercase tracking-wider transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit modal */}
      {editGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-surface border border-surface-border rounded-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-50">Edit Guest</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-forest-400 uppercase tracking-wider">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-forest-400 uppercase tracking-wider">Thaal / Table</label>
                <Input value={editTable} onChange={(e) => setEditTable(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditGuest(null)} className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 uppercase tracking-wider transition-colors">
                Cancel
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                disabled={saving}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded text-xs text-forest-950 font-bold uppercase tracking-wider transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-surface border border-surface-border rounded-lg w-full max-w-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-green-50">Delete Guest</h2>
            <p className="text-xs text-forest-400">This will permanently delete the guest and all their message history. This cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-xs text-forest-400 hover:text-forest-200 uppercase tracking-wider transition-colors">
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-xs text-white font-bold uppercase tracking-wider transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
