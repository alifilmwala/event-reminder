/**
 * /g/[token]  — Public personalized guest reminder card
 *
 * No auth required. The token itself is the authorization.
 * Shows guest name, table number, event details and a downloadable reminder card.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuestByToken, getEvent, updateGuest } from '@/lib/data';
import { GuestCard } from './GuestCard';
import { format } from 'date-fns';

interface PageProps {
  params: { token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guest = await getGuestByToken(params.token);
  if (!guest) return { title: 'Not Found' };
  const event = await getEvent();
  return {
    title: `${guest.name} — Your Event Reminder`,
    description: `Table ${guest.tableNumber} | ${event.name}`,
    robots: 'noindex, nofollow',
  };
}

export default async function GuestPage({ params }: PageProps) {
  // Basic token format sanity-check before hitting the store
  if (!/^[A-Za-z0-9_-]{40,}$/.test(params.token)) notFound();

  const [guest, event] = await Promise.all([
    getGuestByToken(params.token),
    getEvent(),
  ]);

  if (!guest) notFound();

  // Record first visit (fire-and-forget, non-blocking)
  if (!guest.linkVisited) {
    void updateGuest(guest.id, { linkVisited: true, visitedAt: new Date().toISOString() });
  }

  const eventDate = format(new Date(event.date), 'EEEE, MMMM d, yyyy');
  const eventTime = format(new Date(event.date), 'h:mm a');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <GuestCard
        guestName={guest.name}
        tableNumber={guest.tableNumber}
        eventName={event.name}
        eventDate={eventDate}
        eventTime={eventTime}
        eventVenue={event.venue}
      />
    </main>
  );
}

