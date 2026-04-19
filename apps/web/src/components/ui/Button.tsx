import * as React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 text-forest-950 hover:bg-brand-400 focus-visible:ring-brand-500 font-semibold tracking-wide',
  secondary: 'bg-surface text-green-100 hover:bg-surface-hover border border-surface-border focus-visible:ring-forest-600',
  danger:    'bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-500',
  ghost:     'bg-transparent text-forest-300 hover:bg-surface focus-visible:ring-forest-600',
  outline:   'border border-brand-700/60 text-brand-400 hover:bg-brand-500/10 focus-visible:ring-brand-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-xs rounded',
  md:  'px-4 py-2   text-sm rounded',
  lg:  'px-6 py-2.5 text-sm rounded uppercase tracking-widest',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
