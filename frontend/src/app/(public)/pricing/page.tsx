'use client';

import { useState, useEffect } from 'react';
import { PricingCard, PricingToggle } from '@/components/ui/pricing-card';
import { RiskWarning } from '@/components/ui/disclaimer';
import { subscriptionApi } from '@/lib/api-client';
import { Check } from 'lucide-react';
import type { TierInfo, SubscriptionTier } from '@/types';

// Feature comparison data
const FEATURE_COMPARISON = [
  { feature: 'Portfolio Tracking', basic: true, pro: true, premium: true },
  { feature: 'AI Recommendations', basic: true, pro: true, premium: true },
  { feature: 'Basic Analytics', basic: true, pro: true, premium: true },
  { feature: 'Market Summaries', basic: true, pro: true, premium: true },
  { feature: 'Advanced Analytics', basic: false, pro: true, premium: true },
  { feature: 'Tax Optimization', basic: false, pro: true, premium: true },
  { feature: 'Downloadable Reports', basic: false, pro: true, premium: true },
  { feature: 'Weekly Digest Emails', basic: false, pro: true, premium: true },
  { feature: 'Broker-Assisted Execution', basic: false, pro: false, premium: true },
  { feature: 'Robo-Advisor Suggestions', basic: false, pro: false, premium: true },
  { feature: 'API Access', basic: false, pro: false, premium: true },
  { feature: 'Priority Support', basic: false, pro: false, premium: true },
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
          name: 'Basic',
          description: 'Essential tools for getting started',
          monthlyPrice: 9.99,
          yearlyPrice: 99.0,
          popular: false,
          features: [],
        },
        {
          tier: 'pro',
          name: 'Pro',
          description: 'Advanced analytics for serious investors',
          monthlyPrice: 29.99,
          yearlyPrice: 299.0,
          popular: true,
          features: [],
        },
        {
          tier: 'premium',
          name: 'Premium',
          description: 'Full-service with broker execution',
          monthlyPrice: 79.99,
          yearlyPrice: 799.0,
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
            All plans include a 14-day free trial. No credit card required to start.
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
                    Basic
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
