import { notFound } from 'next/navigation';

export default function GuestNotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-slate-100">Link Not Found</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          This reminder link is invalid or has expired. Please contact the event organizer for your details.
        </p>
      </div>
    </main>
  );
}
