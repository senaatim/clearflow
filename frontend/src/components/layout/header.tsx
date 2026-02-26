'use client';

import { Bell, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-10">
      <div className="flex flex-col gap-1 md:gap-2">
        <h1 className="text-2xl md:text-[32px] font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <div className="text-text-secondary text-sm">{subtitle}</div>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </header>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn text-sm',
        variant === 'primary' ? 'btn-primary' : 'btn-secondary',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn('icon-btn', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchBar() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        placeholder="Search assets, reports..."
        className="pl-10 pr-4 py-2.5 bg-background-tertiary border border-border rounded-btn text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors w-full md:w-64"
      />
    </div>
  );
}

export function NotificationBell() {
  return (
    <div className="relative">
      <IconButton>
        <Bell className="w-4 h-4 text-text-secondary" />
      </IconButton>
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent-primary rounded-full" />
    </div>
  );
}
