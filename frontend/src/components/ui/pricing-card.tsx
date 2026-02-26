'use client';

import { cn } from '@/lib/utils';
import { Button } from './button';
import { Check, X } from 'lucide-react';
import type { TierInfo, SubscriptionTier } from '@/types';

interface PricingCardProps {
  tier: TierInfo;
  isCurrentPlan?: boolean;
  billingPeriod: 'monthly' | 'yearly';
  onSelect: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PricingCard({
  tier,
  isCurrentPlan = false,
  billingPeriod,
  onSelect,
  isLoading = false,
  disabled = false,
}: PricingCardProps) {
  const price = billingPeriod === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
  const monthlyEquivalent = billingPeriod === 'yearly' ? tier.yearlyPrice / 12 : tier.monthlyPrice;
  const savings = billingPeriod === 'yearly' ? (tier.monthlyPrice * 12 - tier.yearlyPrice) : 0;
  const savingsPercent = billingPeriod === 'yearly' ? Math.round((savings / (tier.monthlyPrice * 12)) * 100) : 0;

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-6 md:p-8 transition-all duration-300',
        tier.popular
          ? 'border-accent-primary bg-accent-primary/5 scale-105 shadow-lg shadow-accent-primary/10'
          : 'border-border bg-background-secondary hover:border-accent-primary/50',
        isCurrentPlan && 'ring-2 ring-accent-primary'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent-primary text-background-primary text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-success text-background-primary text-xs font-semibold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-text-primary mb-2">{tier.name}</h3>
        <p className="text-sm text-text-secondary">{tier.description}</p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl md:text-5xl font-bold text-text-primary">
            ₦{monthlyEquivalent.toFixed(2)}
          </span>
          <span className="text-text-muted">/mo</span>
        </div>
        {billingPeriod === 'yearly' && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-text-secondary">
              Billed ₦{price.toFixed(2)} yearly
            </p>
            {savings > 0 && (
              <p className="text-sm text-success font-medium">
                Save ₦{savings.toFixed(2)} ({savingsPercent}% off)
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature) => (
          <li key={feature.name} className="flex items-start gap-3">
            {feature.included ? (
              <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
            )}
            <span
              className={cn(
                'text-sm',
                feature.included ? 'text-text-primary' : 'text-text-muted line-through'
              )}
            >
              {feature.name}
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier.tier)}
        variant={tier.popular ? 'primary' : 'secondary'}
        className="w-full"
        isLoading={isLoading}
        disabled={disabled || isCurrentPlan}
      >
        {isCurrentPlan ? 'Current Plan' : `Get ${tier.name}`}
      </Button>
    </div>
  );
}

interface PricingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
}

export function PricingToggle({ value, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <button
        onClick={() => onChange('monthly')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          value === 'monthly'
            ? 'bg-accent-primary text-background-primary'
            : 'text-text-secondary hover:text-text-primary'
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange('yearly')}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          value === 'yearly'
            ? 'bg-accent-primary text-background-primary'
            : 'text-text-secondary hover:text-text-primary'
        )}
      >
        Yearly
        <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
          Save 17%
        </span>
      </button>
    </div>
  );
}
