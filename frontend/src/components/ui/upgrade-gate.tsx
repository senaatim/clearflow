'use client';

import Link from 'next/link';
import { Lock, Zap, Sparkles, Crown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import type { SubscriptionTier } from '@/types';

const TIER_CONFIG: Record<
  SubscriptionTier,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  basic: {
    label: 'Free',
    icon: Zap,
    color: 'text-accent-secondary',
    bg: 'bg-accent-secondary/10',
  },
  pro: {
    label: 'ClearFlow Pro',
    icon: Sparkles,
    color: 'text-accent-primary',
    bg: 'bg-accent-primary/10',
  },
  premium: {
    label: 'ClearFlow Premium',
    icon: Crown,
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
};

interface UpgradeGateProps {
  requiredTier: SubscriptionTier;
  featureName: string;
  description?: string;
  className?: string;
}

export function UpgradeGate({
  requiredTier,
  featureName,
  description,
  className,
}: UpgradeGateProps) {
  const config = TIER_CONFIG[requiredTier];
  const TierIcon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center',
        className,
      )}
    >
      <div className={cn('w-20 h-20 rounded-2xl flex items-center justify-center mb-6', config.bg)}>
        <Lock className={cn('w-8 h-8', config.color)} />
      </div>

      <h2 className="text-2xl font-bold text-text-primary mb-2">{featureName}</h2>

      <p className="text-text-secondary max-w-md mb-2">
        {description ?? `This feature is available on ${config.label} and above.`}
      </p>

      <div
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 mt-2',
          config.bg,
          config.color,
        )}
      >
        <TierIcon className="w-4 h-4" />
        Requires {config.label}
      </div>

      <Link href="/subscription">
        <Button>Upgrade Now</Button>
      </Link>
    </div>
  );
}
