import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { label: string; positive?: boolean };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-brand-400',
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <span className={cn('p-2 rounded-lg bg-slate-700/50', iconColor)}>
          <Icon size={18} />
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-slate-100 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.positive
                ? 'bg-emerald-900/40 text-emerald-400'
                : 'bg-red-900/40 text-red-400',
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
