'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Briefcase,
  PieChart,
  ArrowRightLeft,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const overviewItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
];

const operationsItems = [
  { href: '/admin/fund-requests', label: 'Fund Requests', icon: DollarSign },
  { href: '/admin/trades', label: 'Trade Requests', icon: Briefcase },
];

const dataItems = [
  { href: '/admin/portfolios', label: 'Portfolios', icon: PieChart },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowRightLeft },
];

interface NavSectionProps {
  label: string;
  items: typeof overviewItems;
  onItemClick?: () => void;
}

function NavSection({ label, items, onItemClick }: NavSectionProps) {
  const pathname = usePathname();

  return (
    <div className="mb-6">
      <div className="px-4 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'opacity-100' : 'opacity-70')} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavClick = () => setIsMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-background-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">ClearFlow</h1>
            <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>
      </div>

      {/* Switch to user view */}
      <div className="px-4 mb-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary bg-background-tertiary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Switch to User View
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <NavSection label="Overview" items={overviewItems} onItemClick={handleNavClick} />
        <NavSection label="Operations" items={operationsItems} onItemClick={handleNavClick} />
        <NavSection label="Data" items={dataItems} onItemClick={handleNavClick} />
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-accent-primary/20 rounded-lg flex items-center justify-center text-accent-primary text-sm font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-accent-primary capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-muted hover:text-accent-danger rounded-lg hover:bg-accent-danger/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-background-secondary rounded-xl border border-border"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] bg-background-secondary border-r border-border z-40 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-[280px] bg-background-secondary border-r border-border z-40 flex flex-col md:hidden transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
