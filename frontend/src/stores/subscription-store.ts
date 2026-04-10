import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionTier, SubscriptionStatus, SubscriptionWithFeatures } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

function isAdmin(): boolean {
  return useAuthStore.getState().user?.role === 'admin';
}

// Feature definitions by tier — must stay in sync with backend TIER_FEATURES
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  basic: [
    'news_feed',
    'basic_screener',
    'health_cards',
  ],
  pro: [
    'news_feed',
    'basic_screener',
    'health_cards',
    'full_screener',
    'portfolio_tracking',
    'basic_recommendations',
    'basic_analytics',
    'market_summaries',
    'portfolio_builder',
    'behaviour_tools',
    'earnings_decoder',
    'ngx_module',
  ],
  premium: [
    'news_feed',
    'basic_screener',
    'health_cards',
    'full_screener',
    'portfolio_tracking',
    'basic_recommendations',
    'basic_analytics',
    'market_summaries',
    'portfolio_builder',
    'behaviour_tools',
    'earnings_decoder',
    'ngx_module',
    'dcf_models',
    'macro_dashboard',
    'full_portfolio_analytics',
    'priority_alerts',
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

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  basic: 'Free',
  pro: 'ClearFlow Pro',
  premium: 'ClearFlow Premium',
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
        if (isAdmin()) return true;

        const { status, subscription } = get();
        if (!status || !subscription) return false;
        if (status !== 'active') return false;

        // Check if subscription has expired
        const endDate = new Date(subscription.currentPeriodEnd);
        return endDate > new Date();
      },

      canAccess: (feature) => {
        if (isAdmin()) return true;

        const { tier, status, subscription } = get();

        // No subscription — treat as free tier for free features
        if (!tier || !status || !subscription) {
          return TIER_FEATURES['basic'].includes(feature);
        }

        // Not active = fall back to free tier features
        if (status !== 'active') {
          return TIER_FEATURES['basic'].includes(feature);
        }

        // Check expiration — fall back to free tier
        const endDate = new Date(subscription.currentPeriodEnd);
        if (endDate <= new Date()) {
          return TIER_FEATURES['basic'].includes(feature);
        }

        const tierFeatures = TIER_FEATURES[tier] || [];
        return tierFeatures.includes(feature);
      },

      getTierName: () => {
        const { tier } = get();
        if (!tier) return 'Free';
        return TIER_DISPLAY_NAMES[tier] ?? tier;
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

// Feature constants for easy reference — must match backend Features class
export const Features = {
  // Free tier
  NEWS_FEED: 'news_feed',
  BASIC_SCREENER: 'basic_screener',
  HEALTH_CARDS: 'health_cards',
  // Pro tier
  FULL_SCREENER: 'full_screener',
  PORTFOLIO_TRACKING: 'portfolio_tracking',
  BASIC_RECOMMENDATIONS: 'basic_recommendations',
  BASIC_ANALYTICS: 'basic_analytics',
  MARKET_SUMMARIES: 'market_summaries',
  PORTFOLIO_BUILDER: 'portfolio_builder',
  BEHAVIOUR_TOOLS: 'behaviour_tools',
  EARNINGS_DECODER: 'earnings_decoder',
  NGX_MODULE: 'ngx_module',
  // Premium tier
  DCF_MODELS: 'dcf_models',
  MACRO_DASHBOARD: 'macro_dashboard',
  FULL_PORTFOLIO_ANALYTICS: 'full_portfolio_analytics',
  PRIORITY_ALERTS: 'priority_alerts',
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
