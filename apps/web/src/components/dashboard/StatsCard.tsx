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
        'bg-surface border border-surface-border rounded p-5 flex flex-col gap-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600/80">{title}</span>
        <span className={cn('p-2 rounded bg-surface-muted border border-surface-border', iconColor)}>
          <Icon size={16} />
        </span>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-green-50 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider',
              trend.positive
                ? 'bg-forest-900/60 text-forest-300'
                : 'bg-red-950/60 text-red-400',
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
