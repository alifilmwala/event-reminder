'use client';

/**
 * GuestCard â€” formal invitation-style reminder card inspired by ITS52.
 * Deep green + gold palette.
 */
import { useRef, useState } from 'react';
import { CalendarDays, MapPin, Users, Download } from 'lucide-react';
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
    <div className="w-full flex flex-col items-center gap-6 animate-slide-up">
      {/* The printable card */}
      <div
        ref={cardRef}
        className="w-full overflow-hidden shadow-2xl"
        style={{ backgroundImage: "url('/bg-pattern.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay for legibility */}
        <div style={{ background: 'linear-gradient(160deg, rgba(5,14,8,0.88) 0%, rgba(10,24,12,0.82) 100%)' }}>

          {/* Gold top border */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3a2a08, #c9a84c, #d4a843, #c9a84c, #3a2a08)' }} />

          <div className="px-8 py-8 flex flex-col gap-5">

            {/* Event name */}
            <div className="text-center">
              <h2
                className="text-xl font-bold uppercase tracking-widest font-display"
                style={{ color: '#c9a84c' }}
              >
                {eventName}
              </h2>
            </div>

            {/* Gold divider */}
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c80, transparent)' }} />

            {/* Guest greeting */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: '#6fcf97' }}>Dear</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#f5f0e8' }}>{guestName}</p>
              <p className="text-xs mt-2 tracking-wider" style={{ color: '#6fcf97' }}>
                We look forward to welcoming you
              </p>
            </div>

            {/* Gold divider */}
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c50, transparent)' }} />

            {/* Table number */}
            <div
              className="flex flex-col items-center py-6"
              style={{ border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users size={13} style={{ color: '#c9a84c' }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: '#c9a84c80' }}>
                  Your Thaal
                </span>
              </div>
              <span
                className="text-7xl font-black tracking-tight"
                style={{ color: '#c9a84c', textShadow: '0 0 40px rgba(201,168,76,0.4)' }}
              >
                {tableNumber}
              </span>
            </div>

            {/* Gold divider */}
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c50, transparent)' }} />

            {/* Event details */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm" style={{ color: '#a8e4c0' }}>
                <CalendarDays size={14} style={{ color: '#c9a84c80' }} className="flex-shrink-0" />
                <span>{eventDate} &nbsp;&middot;&nbsp; {eventTime}</span>
              </div>
              {eventVenue && (
                <div className="flex items-center gap-3 text-sm" style={{ color: '#a8e4c0' }}>
                  <MapPin size={14} style={{ color: '#c9a84c80' }} className="flex-shrink-0" />
                  <span>{eventVenue}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: '#3db876' }}>
              Please carry this reminder to the venue
            </p>
          </div>

          {/* Gold bottom border */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3a2a08, #c9a84c, #d4a843, #c9a84c, #3a2a08)' }} />

        </div>
      </div>

      {/* Download button */}
      <Button onClick={downloadCard} loading={saving} size="lg" className="w-full max-w-xs shadow-lg">
        <Download size={16} />
        {saving ? 'Generating…' : 'Download Reminder Card'}
      </Button>

      <p className="text-xs text-center max-w-xs tracking-widest uppercase" style={{ color: '#3db876' }}>
        Save this card and present it at the entrance
      </p>
    </div>
  );
}
