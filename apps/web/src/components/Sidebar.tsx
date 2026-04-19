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
  Zap,
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
    <aside className="flex flex-col h-full w-64 bg-sidebar border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="p-1.5 bg-brand-600 rounded-lg">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-slate-100 font-bold text-base tracking-tight">
          EventReminder
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
