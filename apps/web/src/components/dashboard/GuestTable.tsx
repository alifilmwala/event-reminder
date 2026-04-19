'use client';

import { useState } from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const totalPages = Math.ceil(total / pageSize);

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
                      <Button
                        variant="outline"
                        size="sm"
                        loading={resendingId === g.id}
                        onClick={() => handleResend(g.id)}
                      >
                        Resend
                      </Button>
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
    </div>
  );
}
