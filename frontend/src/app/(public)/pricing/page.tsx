'use client';

import { useState, useEffect } from 'react';
import { PricingCard, PricingToggle } from '@/components/ui/pricing-card';
import { RiskWarning } from '@/components/ui/disclaimer';
import { subscriptionApi } from '@/lib/api-client';
import { Check } from 'lucide-react';
import type { TierInfo, SubscriptionTier } from '@/types';

// Feature comparison data
const FEATURE_COMPARISON = [
  { feature: 'News Intelligence Feed', basic: true,  pro: true,  premium: true  },
  { feature: 'Basic Stock Screener',   basic: true,  pro: true,  premium: true  },
  { feature: 'Company Health Cards',   basic: true,  pro: true,  premium: true  },
  { feature: 'Full Stock Screener',    basic: false, pro: true,  premium: true  },
  { feature: 'Portfolio Builder',      basic: false, pro: true,  premium: true  },
  { feature: 'Behaviour Tools',        basic: false, pro: true,  premium: true  },
  { feature: 'Earnings Decoder',       basic: false, pro: true,  premium: true  },
  { feature: 'NGX Module',             basic: false, pro: true,  premium: true  },
  { feature: 'AI Recommendations',     basic: false, pro: true,  premium: true  },
  { feature: 'DCF Valuation Models',   basic: false, pro: false, premium: true  },
  { feature: 'Macro Dashboard',        basic: false, pro: false, premium: true  },
  { feature: 'Full Portfolio Analytics',basic: false, pro: false, premium: true },
  { feature: 'Priority Alerts',        basic: false, pro: false, premium: true  },
  { feature: 'Tax Optimization',       basic: false, pro: false, premium: true  },
  { feature: 'Broker-Assisted Trading',basic: false, pro: false, premium: true  },
  { feature: 'Priority Support',       basic: false, pro: false, premium: true  },
];

const FAQ = [
  {
    question: 'What is included in the free trial?',
    answer:
      'The 14-day free trial gives you full access to all features of your selected plan. No credit card is required to start, and you can cancel anytime.',
  },
  {
    question: 'How does broker-assisted execution work?',
    answer:
      'When you request a trade, our licensed broker partners review and execute the trade on your behalf. You always stay in control - no automatic trading happens without your approval.',
  },
  {
    question: 'Can I change my plan later?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will immediately get access to new features. When downgrading, the change takes effect at the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and select mobile money providers.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use bank-level encryption and security measures to protect your data. We never share your personal information with third parties without your consent.',
  },
  {
    question: 'Do you guarantee investment returns?',
    answer:
      'No. ClearFlow provides investment intelligence and recommendations, but all investments carry risk. Past performance does not guarantee future results. We encourage you to consult with a financial advisor.',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const response = await subscriptionApi.getTiers();
      setTiers(response.data.tiers);
    } catch (error) {
      // Fallback to static data
      setTiers([
        {
          tier: 'basic',
          name: 'Free',
          description: 'News feed, basic screener & Company Health Cards',
          monthlyPrice: 0,
          yearlyPrice: 0,
          popular: false,
          features: [],
        },
        {
          tier: 'pro',
          name: 'ClearFlow Pro',
          description: 'Full screener, Portfolio Builder, Earnings Decoder & NGX module',
          monthlyPrice: 10000,
          yearlyPrice: 96000,
          popular: true,
          features: [],
        },
        {
          tier: 'premium',
          name: 'ClearFlow Premium',
          description: 'DCF models, Macro Dashboard & full Portfolio Analytics',
          monthlyPrice: 20000,
          yearlyPrice: 192000,
          popular: false,
          features: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTier = (tier: SubscriptionTier) => {
    window.location.href = `/register?plan=${tier}&billing=${billingPeriod}`;
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Start free — upgrade when you need more power. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <PricingToggle value={billingPeriod} onChange={setBillingPeriod} />

        {/* Pricing Cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-background-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.tier}
                tier={{
                  ...tier,
                  features: FEATURE_COMPARISON.filter((f) => f[tier.tier as keyof typeof f]).map(
                    (f) => ({
                      name: f.feature,
                      description: '',
                      included: f[tier.tier as keyof typeof f] as boolean,
                    })
                  ),
                }}
                billingPeriod={billingPeriod}
                onSelect={handleSelectTier}
              />
            ))}
          </div>
        )}

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-text-primary">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-text-primary">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-accent-primary">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-text-primary">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="py-4 px-4 text-sm text-text-secondary">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.basic ? (
                        <Check className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-accent-primary/5">
                      {row.pro ? (
                        <Check className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.premium ? (
                        <Check className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="max-w-2xl mx-auto mb-16">
          <RiskWarning />
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div
                key={item.question}
                className="bg-background-secondary border border-border rounded-xl p-6"
              >
                <h3 className="text-base font-semibold text-text-primary mb-2">{item.question}</h3>
                <p className="text-sm text-text-secondary">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
