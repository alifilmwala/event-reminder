'use client';

/**
 * GuestCard â€” formal invitation-style reminder card inspired by ITS52.
 * Deep green + gold palette.
 */
import { useRef, useState } from 'react';
import { CalendarDays, MapPin, Users, Download, Star } from 'lucide-react';
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
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
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
        className="w-full overflow-hidden shadow-2xl"
        style={{ backgroundImage: "url('/bg-pattern.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Gold top border */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3a2a08, #c9a84c, #d4a843, #c9a84c, #3a2a08)' }} />

        <div className="px-8 py-8 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-brand-400" fill="currentColor" />
              <span className="text-[10px] font-semibold text-brand-500/80 uppercase tracking-[0.25em]">
                Event Reminder
              </span>
            </div>
            <Star size={14} className="text-brand-700" fill="currentColor" />
          </div>

          {/* Gold divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c60, transparent)' }} />

          {/* Event name */}
          <div className="text-center">
            <h2
              className="text-xl font-bold uppercase tracking-widest"
              style={{ color: '#c9a84c' }}
            >
              {eventName}
            </h2>
          </div>

          {/* Gold divider */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c60, transparent)' }} />

          {/* Guest greeting */}
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-forest-500">Dear</p>
            <p className="text-3xl font-bold text-green-50 mt-1">{guestName}</p>
            <p className="text-forest-500 text-xs mt-2 tracking-wider">
              We look forward to welcoming you
            </p>
          </div>

          {/* Table number */}
          <div
            className="flex flex-col items-center py-5 border"
            style={{ borderColor: '#c9a84c40', background: 'rgba(201,168,76,0.05)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} style={{ color: '#c9a84c' }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: '#c9a84c80' }}>Your Table</span>
            </div>
            <span
              className="text-6xl font-black tracking-tight"
              style={{ color: '#c9a84c' }}
            >
              {tableNumber}
            </span>
          </div>

          {/* Event details */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 text-sm text-forest-400">
              <CalendarDays size={14} style={{ color: '#c9a84c80' }} className="flex-shrink-0" />
              <span>{eventDate} &nbsp;Â·&nbsp; {eventTime}</span>
            </div>
            {eventVenue && (
              <div className="flex items-center gap-3 text-sm text-forest-400">
                <MapPin size={14} style={{ color: '#c9a84c80' }} className="flex-shrink-0" />
                <span>{eventVenue}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-forest-700 mt-1">
            Please carry this reminder to the venue
          </p>
        </div>

        {/* Gold bottom border */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3a2a08, #c9a84c, #d4a843, #c9a84c, #3a2a08)' }} />
      </div>

      {/* Download button */}
      <Button onClick={downloadCard} loading={saving} size="lg" className="w-full max-w-xs shadow-lg">
        <Download size={16} />
        {saving ? 'Generatingâ€¦' : 'Download Reminder Card'}
      </Button>

      <p className="text-xs text-forest-700 text-center max-w-xs tracking-wider uppercase">
        Save this card and present it at the entrance
      </p>
    </div>
  );
}
