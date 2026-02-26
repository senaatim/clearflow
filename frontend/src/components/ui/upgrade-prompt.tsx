'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { TIER_INFO, FEATURE_INFO } from '@/lib/subscription';
import type { SubscriptionTier } from '@/types';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: string;
  currentTier: SubscriptionTier | null;
  requiredTier: SubscriptionTier | null;
  title?: string;
  description?: string;
  variant?: 'card' | 'inline' | 'modal';
  className?: string;
}

export function UpgradePrompt({
  feature,
  currentTier,
  requiredTier,
  title,
  description,
  variant = 'card',
  className,
}: UpgradePromptProps) {
  const featureInfo = FEATURE_INFO[feature];
  const tierInfo = requiredTier ? TIER_INFO[requiredTier] : null;

  const defaultTitle = title || `Upgrade to ${tierInfo?.name || 'a higher plan'}`;
  const defaultDescription =
    description ||
    `${featureInfo?.name || 'This feature'} requires a ${tierInfo?.name || 'higher tier'} subscription. Upgrade now to unlock advanced features and take your investing to the next level.`;

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 p-3 bg-accent-primary/5 border border-accent-primary/20 rounded-lg', className)}>
        <Lock className="w-4 h-4 text-accent-primary flex-shrink-0" />
        <p className="text-sm text-text-secondary flex-1">
          {featureInfo?.name || 'This feature'} requires{' '}
          <span className="text-accent-primary font-medium">{tierInfo?.name || 'an upgrade'}</span>
        </p>
        <Link href="/pricing">
          <Button size="sm" variant="primary">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn('text-center p-8', className)}>
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-primary/10 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-accent-primary" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">{defaultTitle}</h3>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">{defaultDescription}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/pricing">
            <Button variant="primary" size="lg">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-background-secondary p-6 md:p-8',
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{defaultTitle}</h3>
            <p className="text-sm text-text-secondary">{defaultDescription}</p>
          </div>
        </div>

        {tierInfo && (
          <div className="bg-background-tertiary rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">{tierInfo.name} Plan</span>
              <span className="text-accent-primary font-semibold">Recommended</span>
            </div>
            <p className="text-xs text-text-secondary">{tierInfo.description}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pricing" className="flex-1">
            <Button variant="primary" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary" className="w-full sm:w-auto">
              Compare Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

interface LockedFeatureOverlayProps {
  feature: string;
  requiredTier: SubscriptionTier | null;
  children: React.ReactNode;
}

export function LockedFeatureOverlay({
  feature,
  requiredTier,
  children,
}: LockedFeatureOverlayProps) {
  const tierInfo = requiredTier ? TIER_INFO[requiredTier] : null;
  const featureInfo = FEATURE_INFO[feature];

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background-primary/80 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6">
          <Lock className="w-10 h-10 text-accent-primary mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-text-primary mb-2">
            {featureInfo?.name || 'Feature'} Locked
          </h4>
          <p className="text-sm text-text-secondary mb-4">
            Upgrade to {tierInfo?.name || 'a higher plan'} to unlock
          </p>
          <Link href="/pricing">
            <Button size="sm" variant="primary">
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
