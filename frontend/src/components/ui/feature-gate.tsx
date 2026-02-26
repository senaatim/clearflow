'use client';

import { useSubscriptionStore } from '@/stores/subscription-store';
import { UpgradePrompt } from './upgrade-prompt';
import { getMinimumTierForFeature } from '@/lib/subscription';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { canAccess, tier } = useSubscriptionStore();

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    const requiredTier = getMinimumTierForFeature(feature);
    return <UpgradePrompt feature={feature} currentTier={tier} requiredTier={requiredTier} />;
  }

  return null;
}

interface RequireSubscriptionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireSubscription({ children, fallback }: RequireSubscriptionProps) {
  const { isActive } = useSubscriptionStore();

  if (isActive()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      feature="dashboard"
      currentTier={null}
      requiredTier="basic"
      title="Subscription Required"
      description="Subscribe to ClearFlow to access your investment dashboard and start making smarter investment decisions."
    />
  );
}
