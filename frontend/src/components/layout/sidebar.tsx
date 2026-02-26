'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PieChart,
  LineChart,
  ArrowRightLeft,
  PlusCircle,
  Brain,
  FileText,
  User,
  Settings,
  Shield,
  Calculator,
  Bot,
  LogOut,
  Menu,
  X,
  Briefcase,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { SubscriptionBadge } from '@/components/layout/subscription-badge';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { Features } from '@/stores/subscription-store';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
];

const tradingNavItems = [
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/trades', label: 'Trade Requests', icon: Briefcase, requireFeature: Features.BROKER_EXECUTION },
  { href: '/add-funds', label: 'Add Funds', icon: PlusCircle },
];

const insightsNavItems = [
  { href: '/ai-advisor', label: 'AI Advisor', icon: Sparkles },
  { href: '/recommendations', label: 'AI Recommendations', icon: Brain },
  { href: '/risk-management', label: 'Risk Management', icon: Shield },
  { href: '/tax-optimization', label: 'Tax Optimization', icon: Calculator },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/automation', label: 'Automation', icon: Bot },
];

const accountNavItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requireFeature?: string;
}

interface NavSectionProps {
  label: string;
  items: NavItem[];
  onItemClick?: () => void;
}

function NavSection({ label, items, onItemClick }: NavSectionProps) {
  const pathname = usePathname();
  const { canAccess } = useSubscriptionStore();

  return (
    <div className="mb-6 md:mb-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 md:mb-3 px-2">
        {label}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        // Skip items that require features the user doesn't have
        if (item.requireFeature && !canAccess(item.requireFeature)) {
          return null;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn('nav-item', isActive && 'active')}
          >
            <Icon className="w-5 h-5 opacity-70" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-background-secondary border border-border rounded-lg flex items-center justify-center"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-background-secondary border border-border rounded-lg flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 w-[280px] h-screen bg-background-secondary border-r border-border py-6 md:py-8 px-4 md:px-6 overflow-y-auto z-50 transition-transform duration-300 ease-in-out',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center font-mono font-bold text-lg text-background-primary">
            CF
          </div>
          <div className="text-xl font-semibold tracking-tight">ClearFlow</div>
        </div>

        {/* Admin Panel Link */}
        {user && (user.role === 'broker' || user.role === 'admin') && (
          <div className="mb-6">
            <Link
              href="/admin/dashboard"
              onClick={handleNavClick}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-accent-primary bg-accent-primary/10 hover:bg-accent-primary/20 transition-colors"
            >
              <Shield className="w-5 h-5" />
              Admin Panel
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav>
          <NavSection label="Main" items={mainNavItems} onItemClick={handleNavClick} />
          <NavSection label="Trading" items={tradingNavItems} onItemClick={handleNavClick} />
          <NavSection label="Insights" items={insightsNavItems} onItemClick={handleNavClick} />
          <NavSection label="Account" items={accountNavItems} onItemClick={handleNavClick} />
        </nav>

        {/* Subscription Badge */}
        <div className="mb-6">
          <SubscriptionBadge variant="full" />
        </div>

        {/* User info and logout */}
        {user && (
          <div className="mt-auto pt-4 md:pt-6 border-t border-border">
            <div className="flex items-center gap-3 mb-4 px-2 md:px-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center font-semibold text-background-primary">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                handleNavClick();
              }}
              className="nav-item w-full text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10"
            >
              <LogOut className="w-5 h-5 opacity-70" />
              Sign Out
            </button>
          </div>
        )}

        {/* Branding */}
        <div className="mt-4 md:mt-6 px-2 md:px-4 text-xs text-text-muted">
          <div>Jbryanson Globals Limited</div>
        </div>
      </aside>
    </>
  );
}
