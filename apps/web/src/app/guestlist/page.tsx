/**
 * /guestlist — Public family guest list
 * No auth required. Shows all guests grouped by thaal (table) with links to their personal cards.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { getGuests, getEvent } from '@/lib/data';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Guest List',
  description: 'View all guests and their personal reminder cards.',
  robots: 'noindex, nofollow',
};

// Revalidate every 60 seconds so new guests appear without a redeploy
export const revalidate = 60;

export default async function GuestListPage() {
  const [guests, event] = await Promise.all([getGuests(), getEvent()]);

  // Group by tableNumber, sorted numerically
  const byTable = new Map<string, typeof guests>();
  for (const g of guests) {
    const key = g.tableNumber;
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key)!.push(g);
  }
  const tables = Array.from(byTable.entries()).sort(
    ([a], [b]) => Number(a) - Number(b) || a.localeCompare(b, undefined, { numeric: true })
  );

  const eventDate = format(new Date(event.date), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.date), 'h:mm a');

  return (
    <main
      className="min-h-screen px-4 py-12 relative"
      style={{
        backgroundImage: "url('/bg-pattern.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(4,10,5,0.78)' }} aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          {/* Gold top rule */}
          <div className="h-px mx-auto w-48 mb-4" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

          <h1
            className="text-2xl font-bold uppercase tracking-widest"
            style={{ color: '#c9a84c' }}
          >
            {event.name}
          </h1>

          <p className="text-sm mt-1" style={{ color: '#a8e4c0' }}>
            {eventDate} &nbsp;·&nbsp; {eventTime}
          </p>
          <p className="text-sm" style={{ color: '#a8e4c0' }}>
            {event.venue}
          </p>

          {/* Gold bottom rule */}
          <div className="h-px mx-auto w-48 mt-4" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }} />

          <p className="text-xs uppercase tracking-widest mt-2" style={{ color: '#c9a84c80' }}>
            Guest List
          </p>
        </div>

        {/* Summary */}
        <p className="text-center text-sm" style={{ color: '#6fcf97' }}>
          {guests.length} {guests.length === 1 ? 'guest' : 'guests'} across {tables.length}{' '}
          {tables.length === 1 ? 'thaal' : 'thaals'}
        </p>

        {/* Tables */}
        {tables.length === 0 ? (
          <p className="text-center text-sm" style={{ color: '#a8e4c0' }}>
            No guests added yet.
          </p>
        ) : (
          tables.map(([tableNumber, tableGuests]) => (
            <div
              key={tableNumber}
              className="overflow-hidden"
              style={{ border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(5,14,8,0.70)' }}
            >
              {/* Table header */}
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ background: 'rgba(201,168,76,0.10)', borderBottom: '1px solid rgba(201,168,76,0.20)' }}
              >
                <Users size={14} style={{ color: '#c9a84c' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#c9a84c' }}>
                  Thaal {tableNumber}
                </span>
                <span className="ml-auto text-xs" style={{ color: '#c9a84c80' }}>
                  {tableGuests.length} {tableGuests.length === 1 ? 'guest' : 'guests'}
                </span>
              </div>

              {/* Guest rows */}
              <ul className="divide-y" style={{ borderColor: 'rgba(201,168,76,0.10)' }}>
                {tableGuests.map((guest) => (
                  <li key={guest.id}>
                    <Link
                      href={`/g/${guest.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-5 py-4 group transition-colors"
                      style={{ color: 'inherit' }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-sm font-medium group-hover:underline"
                          style={{ color: '#f5f0e8' }}
                        >
                          {guest.name}
                        </span>
                        <span className="text-xs" style={{ color: '#6fcf97' }}>
                          {guest.mobile} &nbsp;·&nbsp; Thaal {guest.tableNumber}
                        </span>
                      </div>
                      <span
                        className="text-xs opacity-60 group-hover:opacity-100 transition-opacity ml-4 shrink-0"
                        style={{ color: '#c9a84c' }}
                      >
                        View card →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {/* Footer note */}
        <p className="text-center text-xs pb-4" style={{ color: '#c9a84c40' }}>
          Click a name to open the personal reminder card
        </p>
      </div>
    </main>
  );
}
