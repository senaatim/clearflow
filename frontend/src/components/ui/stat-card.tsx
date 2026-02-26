import { cn } from '@/lib/utils';
import { Badge } from './badge';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  change,
  changeType = 'positive',
  subtitle,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'stat-card animate-fade-in-up',
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className="text-xs md:text-[13px] text-text-secondary font-medium">{label}</div>
        {change && <Badge variant={changeType}>{change}</Badge>}
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1 md:mb-2">{value}</div>
      {subtitle && <div className="text-xs md:text-[13px] text-text-muted">{subtitle}</div>}
    </div>
  );
}
