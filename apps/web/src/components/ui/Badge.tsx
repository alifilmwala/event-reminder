import { cn } from '@/lib/cn';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variantMap: Record<Variant, string> = {
  success: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
  warning: 'bg-amber-900/40  text-amber-300  border border-amber-700/50',
  danger:  'bg-red-900/40    text-red-300    border border-red-700/50',
  info:    'bg-blue-900/40   text-blue-300   border border-blue-700/50',
  neutral: 'bg-slate-700/60  text-slate-300  border border-slate-600/50',
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
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
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
