'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  MessageSquare,
  Settings,
  LogOut,
  Star,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/guests',    label: 'Guests',    icon: Users           },
  { href: '/schedule',  label: 'Schedule',  icon: CalendarClock   },
  { href: '/whatsapp',  label: 'WhatsApp',  icon: MessageSquare   },
  { href: '/settings',  label: 'Settings',  icon: Settings        },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full w-64 bg-sidebar border-r border-surface-border">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 px-5 py-6 border-b border-surface-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-brand-600/60 bg-surface shadow-sm">
          <Star size={16} className="text-brand-400" fill="currentColor" />
        </div>
        <div className="text-center">
          <span className="text-green-50 font-bold text-sm tracking-widest uppercase block">
            Event Reminder
          </span>
          <span className="text-brand-600/70 text-[10px] tracking-[0.2em] uppercase">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Divider line */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-brand-800/40 to-transparent mt-1" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-brand-500/10 text-brand-400 border-l-2 border-brand-500 pl-[10px]'
                  : 'text-forest-300 hover:bg-surface hover:text-brand-300 border-l-2 border-transparent pl-[10px]',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-surface-border">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-forest-400 hover:bg-surface hover:text-red-400 transition-colors border-l-2 border-transparent pl-[10px]"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
