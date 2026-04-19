import type { Metadata } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter  = Inter ({ subsets: ['latin'], variable: '--font-inter'  });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel', weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: 'EventReminder — WhatsApp Guest Management',
  description: 'Send personalized WhatsApp reminders to event guests.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} font-sans text-green-50 antialiased`} style={{ backgroundImage: "url('/bg-pattern.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0f2419', color: '#f0fdf4', border: '1px solid #1e3d28' },
            success: { iconTheme: { primary: '#d4a843', secondary: '#0f2419' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f2419' } },
          }}
        />
      </body>
    </html>
  );
}
