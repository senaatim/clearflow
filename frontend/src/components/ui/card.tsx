import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('card p-4 md:p-6 lg:p-8', className)} {...props}>
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  actions?: React.ReactNode;
}

export function CardHeader({ title, actions, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6', className)} {...props}>
      <h2 className="text-base md:text-lg font-semibold tracking-tight">{title}</h2>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
