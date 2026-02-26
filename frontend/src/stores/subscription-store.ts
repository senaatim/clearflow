import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionTier, SubscriptionStatus, SubscriptionWithFeatures } from '@/types';

// Feature definitions by tier
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  basic: [
    'portfolio_tracking',
    'basic_recommendations',
    'basic_analytics',
    'market_summaries',
  ],
  pro: [
    'portfolio_tracking',
    'basic_recommendations',
    'basic_analytics',
    'market_summaries',
    'advanced_analytics',
    'tax_optimization',
    'downloadable_reports',
    'weekly_digest',
  ],
  premium: [
    'portfolio_tracking',
    'basic_recommendations',
    'basic_analytics',
    'market_summaries',
    'advanced_analytics',
    'tax_optimization',
    'downloadable_reports',
    'weekly_digest',
    'broker_execution',
    'robo_advisor',
    'api_access',
    'priority_support',
  ],
};

interface SubscriptionState {
  subscription: SubscriptionWithFeatures | null;
  tier: SubscriptionTier | null;
  status: SubscriptionStatus | null;
  features: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSubscription: (subscription: SubscriptionWithFeatures | null) => void;
  clearSubscription: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  isActive: () => boolean;
  canAccess: (feature: string) => boolean;
  getTierName: () => string;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      tier: null,
      status: null,
      features: [],
      isLoading: false,
      error: null,

      setSubscription: (subscription) => {
        if (subscription) {
          set({
            subscription,
            tier: subscription.tier,
            status: subscription.status,
            features: subscription.features || TIER_FEATURES[subscription.tier] || [],
            error: null,
          });
        } else {
          set({
            subscription: null,
            tier: null,
            status: null,
            features: [],
          });
        }
      },

      clearSubscription: () => set({
        subscription: null,
        tier: null,
        status: null,
        features: [],
        error: null,
      }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      isActive: () => {
        const { status, subscription } = get();
        if (!status || !subscription) return false;
        if (status !== 'active') return false;

        // Check if subscription has expired
        const endDate = new Date(subscription.currentPeriodEnd);
        return endDate > new Date();
      },

      canAccess: (feature) => {
        const { tier, status, subscription } = get();

        // No subscription = no access
        if (!tier || !status || !subscription) return false;

        // Not active = no access
        if (status !== 'active') return false;

        // Check expiration
        const endDate = new Date(subscription.currentPeriodEnd);
        if (endDate <= new Date()) return false;

        // Check feature access
        const tierFeatures = TIER_FEATURES[tier] || [];
        return tierFeatures.includes(feature);
      },

      getTierName: () => {
        const { tier } = get();
        if (!tier) return 'None';
        return tier.charAt(0).toUpperCase() + tier.slice(1);
      },
    }),
    {
      name: 'clearflow-subscription',
      partialize: (state) => ({
        subscription: state.subscription,
        tier: state.tier,
        status: state.status,
        features: state.features,
      }),
    }
  )
);

// Feature constants for easy reference
export const Features = {
  PORTFOLIO_TRACKING: 'portfolio_tracking',
  BASIC_RECOMMENDATIONS: 'basic_recommendations',
  BASIC_ANALYTICS: 'basic_analytics',
  MARKET_SUMMARIES: 'market_summaries',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  TAX_OPTIMIZATION: 'tax_optimization',
  DOWNLOADABLE_REPORTS: 'downloadable_reports',
  WEEKLY_DIGEST: 'weekly_digest',
  BROKER_EXECUTION: 'broker_execution',
  ROBO_ADVISOR: 'robo_advisor',
  API_ACCESS: 'api_access',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

// Helper function to check if a tier has a feature
export function tierHasFeature(tier: SubscriptionTier | null, feature: string): boolean {
  if (!tier) return false;
  const features = TIER_FEATURES[tier] || [];
  return features.includes(feature);
}

// Get minimum tier required for a feature
export function getMinimumTierForFeature(feature: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['basic', 'pro', 'premium'];
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(feature)) {
      return tier;
    }
  }
  return null;
}
