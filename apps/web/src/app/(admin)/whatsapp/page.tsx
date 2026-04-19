'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, QrCode, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { WhatsAppStatus } from '@/types';

interface Event { id: string; name: string }

export default function WhatsAppPage() {
  const [status, setStatus]   = useState<WhatsAppStatus>('INITIALIZING');
  const [phone, setPhone]     = useState<string>();
  const [qr, setQr]           = useState<string>();
  const [events, setEvents]   = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [sending, setSending] = useState(false);

  async function refreshStatus() {
    const res  = await fetch('/api/whatsapp');
    const data = await res.json();
    setStatus(data.status ?? 'DISCONNECTED');
    setPhone(data.phone);
  }

  async function loadQr() {
    const res  = await fetch('/api/whatsapp/qr');
    const data = await res.json();
    if (res.ok) setQr(data.qr);
    else toast.error(data.error ?? 'QR not available');
  }

  async function sendBatch() {
    if (!eventId) { toast.error('Select an event first'); return; }
    setSending(true);
    try {
      const res  = await fetch('/api/whatsapp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.ok) toast.success(`Queued ${data.queued} messages`);
      else        toast.error(data.error ?? 'Send failed');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    fetch('/api/events').then((r) => r.json()).then((data: Event | Event[]) => {
      const list = Array.isArray(data) ? data : (data && (data as Event).id ? [data as Event] : []);
      setEvents(list);
      if (list.length) setEventId(list[0].id);
    });
    const interval = setInterval(refreshStatus, 15_000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status === 'CONNECTED';

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">WhatsApp</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your WhatsApp connection and send reminders.</p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Connection Status</CardTitle>
          <Badge variant={isConnected ? 'success' : status === 'QR_PENDING' ? 'warning' : 'danger'}>
            {status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {isConnected
              ? <Wifi size={18} className="text-emerald-400" />
              : <WifiOff size={18} className="text-red-400" />}
            <span className="text-sm text-slate-300">
              {isConnected ? `Connected as ${phone ?? 'Unknown'}` : 'Not connected — scan QR to pair'}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={refreshStatus}>
              Refresh Status
            </Button>
            {!isConnected && (
              <Button variant="outline" size="sm" onClick={loadQr}>
                <QrCode size={14} /> Show QR Code
              </Button>
            )}
          </div>

          {/* QR code panel */}
          {qr && !isConnected && (
            <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${qr}`}
                alt="WhatsApp QR Code"
                className="w-56 h-56 object-contain"
              />
              <p className="text-slate-900 text-xs text-center">
                Open WhatsApp → Linked Devices → Link a Device
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send batch */}
      <Card>
        <CardHeader><CardTitle>Send Reminders</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Sends a personalized WhatsApp message to all guests with a PENDING status for the selected event.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="py-2 px-3 text-sm bg-slate-900 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <Button
            onClick={sendBatch}
            loading={sending}
            disabled={!isConnected || !eventId}
            className="w-full"
          >
            <Send size={15} />
            Send All Pending Messages
          </Button>
          {!isConnected && (
            <p className="text-xs text-amber-400">WhatsApp must be connected before sending.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
