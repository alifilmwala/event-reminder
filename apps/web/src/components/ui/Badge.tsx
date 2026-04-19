import { cn } from '@/lib/cn';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantMap: Record<Variant, string> = {
  success: 'bg-forest-900/60 text-forest-300 border border-forest-700/50',
  warning: 'bg-brand-950/60  text-brand-400  border border-brand-700/40',
  danger:  'bg-red-950/60    text-red-400    border border-red-800/50',
  info:    'bg-forest-900/40 text-forest-300 border border-forest-700/40',
  neutral: 'bg-surface       text-forest-300 border border-surface-border',
};

interface BadgeProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Maps a MessageStatus string to a badge variant */
export function statusVariant(status: string): Variant {
  switch (status) {
    case 'SENT':    return 'success';
    case 'PENDING': return 'warning';
    case 'FAILED':  return 'danger';
    case 'SENDING': return 'info';
    default:        return 'neutral';
  }
}
