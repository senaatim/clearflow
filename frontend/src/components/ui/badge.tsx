import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'negative' | 'neutral' | 'warning';
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  children,
  className,
  ...props
}: BadgeProps) {
  const variantClasses = {
    positive: 'badge-positive',
    negative: 'badge-negative',
    neutral: 'badge-neutral',
    warning: 'bg-warning/15 text-warning',
  };

  return (
    <span
      className={cn('badge', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
