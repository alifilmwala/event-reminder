'use client';

/**
 * GuestCard — beautiful, mobile-responsive reminder card.
 * Includes a "Download as Image" button that uses html2canvas.
 * Loaded client-side so html2canvas only runs in the browser.
 */
import { useRef, useState } from 'react';
import { CalendarDays, MapPin, Users, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GuestCardProps {
  guestName: string;
  tableNumber: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
}

export function GuestCard({
  guestName,
  tableNumber,
  eventName,
  eventDate,
  eventTime,
  eventVenue,
}: GuestCardProps) {
  const cardRef     = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  async function downloadCard() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      // Lazy-load html2canvas only when needed
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3, // high-res output
        useCORS: true,
        logging: false,
      });
      const link   = document.createElement('a');
      link.download = `reminder-${guestName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Could not download the card. Please take a screenshot instead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 animate-slide-up">
      {/* The printable card */}
      <div
        ref={cardRef}
        className="w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        }}
      >
        {/* Top decorative band */}
        <div
          className="h-2 w-full"
          style={{ background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #0ea5e9)' }}
        />

        <div className="px-8 py-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={17} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">
                Event Reminder
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">✦</span>
          </div>

          {/* Event name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white leading-tight">{eventName}</h2>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

          {/* Guest greeting */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">Dear</p>
            <p className="text-3xl font-bold text-white mt-1">{guestName}</p>
            <p className="text-slate-400 text-sm mt-2">
              We look forward to welcoming you!
            </p>
          </div>

          {/* Table number — hero element */}
          <div className="flex flex-col items-center py-5 rounded-2xl border border-brand-600/30 bg-brand-950/40">
            <div className="flex items-center gap-2 text-brand-400 mb-2">
              <Users size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Your Table</span>
            </div>
            <span
              className="text-6xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {tableNumber}
            </span>
          </div>

          {/* Event details */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CalendarDays size={15} className="text-brand-400 flex-shrink-0" />
              <span>{eventDate} &nbsp;·&nbsp; {eventTime}</span>
            </div>
            {eventVenue && (
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <MapPin size={15} className="text-brand-400 flex-shrink-0" />
                <span>{eventVenue}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-2">
            Please carry this reminder card to the venue.
          </p>
        </div>

        {/* Bottom band */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #6366f1, #0ea5e9, #6366f1)' }}
        />
      </div>

      {/* Download button */}
      <Button onClick={downloadCard} loading={saving} size="lg" className="w-full max-w-xs shadow-lg">
        <Download size={16} />
        {saving ? 'Generating…' : 'Download Reminder Card'}
      </Button>

      <p className="text-xs text-slate-600 text-center max-w-xs">
        Save this card and show it at the entrance for quick table assignment.
      </p>
    </div>
  );
}
