import type { SubscriptionTier, TierInfo } from '@/types';

// Feature definitions
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

// Feature display names and descriptions
export const FEATURE_INFO: Record<string, { name: string; description: string }> = {
  portfolio_tracking: {
    name: 'Portfolio Tracking',
    description: 'Track and manage your investment portfolios',
  },
  basic_recommendations: {
    name: 'AI Recommendations',
    description: 'AI-powered investment recommendations',
  },
  basic_analytics: {
    name: 'Basic Analytics',
    description: 'Basic portfolio performance analytics',
  },
  market_summaries: {
    name: 'Market Summaries',
    description: 'Weekly market and sector summaries',
  },
  advanced_analytics: {
    name: 'Advanced Analytics',
    description: 'Advanced analytics with predictions and correlations',
  },
  tax_optimization: {
    name: 'Tax Optimization',
    description: 'Tax-loss harvesting and optimization suggestions',
  },
  downloadable_reports: {
    name: 'Downloadable Reports',
    description: 'Generate and download detailed PDF reports',
  },
  weekly_digest: {
    name: 'Weekly Digest',
    description: 'Personalized weekly investment digest emails',
  },
  broker_execution: {
    name: 'Broker Execution',
    description: 'Request broker-assisted trade execution',
  },
  robo_advisor: {
    name: 'Robo-Advisor',
    description: 'AI-powered portfolio rebalancing recommendations',
  },
  api_access: {
    name: 'API Access',
    description: 'API access for custom integrations',
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Priority customer support',
  },
};

// Tier pricing
export const TIER_PRICING: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
  basic: { monthly: 9.99, yearly: 99.00 },
  pro: { monthly: 29.99, yearly: 299.00 },
  premium: { monthly: 79.99, yearly: 799.00 },
};

// Tier info
export const TIER_INFO: Record<SubscriptionTier, { name: string; description: string; popular: boolean }> = {
  basic: {
    name: 'Basic',
    description: 'Essential tools for getting started with smart investing',
    popular: false,
  },
  pro: {
    name: 'Pro',
    description: 'Advanced analytics and tax optimization for serious investors',
    popular: true,
  },
  premium: {
    name: 'Premium',
    description: 'Full-service investment intelligence with broker execution',
    popular: false,
  },
};

// Check if a tier has access to a feature
export function canAccessFeature(tier: SubscriptionTier | null, feature: string): boolean {
  if (!tier) return false;
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

// Get the minimum tier required for a feature
export function getMinimumTierForFeature(feature: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['basic', 'pro', 'premium'];
  for (const tier of tiers) {
    if (TIER_FEATURES[tier].includes(feature)) {
      return tier;
    }
  }
  return null;
}

// Get upgrade message for a feature
export function getUpgradeMessage(feature: string, currentTier: SubscriptionTier | null): string {
  const minTier = getMinimumTierForFeature(feature);
  if (!minTier) return 'This feature is not available.';

  const featureInfo = FEATURE_INFO[feature];
  const tierInfo = TIER_INFO[minTier];

  if (!currentTier) {
    return `Subscribe to ${tierInfo.name} or higher to access ${featureInfo?.name || 'this feature'}.`;
  }

  const tierOrder: SubscriptionTier[] = ['basic', 'pro', 'premium'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(minTier);

  if (currentIndex >= requiredIndex) {
    return `You have access to ${featureInfo?.name || 'this feature'}.`;
  }

  return `Upgrade to ${tierInfo.name} or higher to access ${featureInfo?.name || 'this feature'}.`;
}

// Format price for display
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

// Calculate savings for yearly billing
export function calculateYearlySavings(tier: SubscriptionTier): { amount: number; percentage: number } {
  const pricing = TIER_PRICING[tier];
  const monthlyTotal = pricing.monthly * 12;
  const savings = monthlyTotal - pricing.yearly;
  const percentage = (savings / monthlyTotal) * 100;

  return {
    amount: savings,
    percentage: Math.round(percentage),
  };
}

// Risk disclaimers
export const DISCLAIMERS = {
  general: 'Investment involves risk. Past performance does not guarantee future results.',
  noGuarantee: 'ClearFlow does not guarantee any returns on investments. All investment decisions should be made based on your own research and risk tolerance.',
  recommendation: 'Recommendations are for informational purposes only and do not constitute financial advice. Always consult with a qualified financial advisor.',
  broker: 'Trade execution is performed by licensed broker partners. ClearFlow does not execute trades directly.',
  ai: 'AI-generated insights are algorithmic suggestions and may not account for all market conditions or personal circumstances.',
};

// Get all disclaimers as array
export function getAllDisclaimers(): string[] {
  return Object.values(DISCLAIMERS);
}
