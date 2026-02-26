'use client';

import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { Crown, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionTier } from '@/types';

interface SubscriptionBadgeProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function SubscriptionBadge({ variant = 'compact', className }: SubscriptionBadgeProps) {
  const { tier, status, getTierName, isActive } = useSubscriptionStore();

  const tierConfig: Record<SubscriptionTier, { icon: typeof Crown; color: string; bgColor: string }> = {
    basic: {
      icon: Zap,
      color: 'text-accent-secondary',
      bgColor: 'bg-accent-secondary/10',
    },
    pro: {
      icon: Sparkles,
      color: 'text-accent-primary',
      bgColor: 'bg-accent-primary/10',
    },
    premium: {
      icon: Crown,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  };

  if (!tier || !isActive()) {
    return (
      <Link href="/pricing" className={cn('block', className)}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary/5 border border-accent-primary/20 hover:bg-accent-primary/10 transition-colors">
          <Sparkles className="w-4 h-4 text-accent-primary" />
          <span className="text-xs font-medium text-accent-primary">Subscribe</span>
        </div>
      </Link>
    );
  }

  const config = tierConfig[tier];
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', config.bgColor, className)}>
        <Icon className={cn('w-4 h-4', config.color)} />
        <span className={cn('text-xs font-medium', config.color)}>{getTierName()}</span>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('rounded-xl p-4', config.bgColor, className)}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        <div>
          <p className={cn('text-sm font-semibold', config.color)}>{getTierName()} Plan</p>
          <p className="text-xs text-text-muted capitalize">{status}</p>
        </div>
      </div>
      <Link
        href="/subscription"
        className="block text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        Manage subscription →
      </Link>
    </div>
  );
}
