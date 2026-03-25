'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingCard, PricingToggle } from '@/components/ui/pricing-card';
import { subscriptionApi } from '@/lib/api-client';
import { useSubscriptionStore, TIER_DISPLAY_NAMES } from '@/stores/subscription-store';
import {
  Crown,
  Sparkles,
  Zap,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TierInfo, SubscriptionTier, SubscriptionInvoice } from '@/types';

export default function SubscriptionPage() {
  const { subscription, tier, status, setSubscription } = useSubscriptionStore();
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tiersRes, currentRes, invoicesRes] = await Promise.all([
        subscriptionApi.getTiers(),
        subscriptionApi.getCurrent(),
        subscriptionApi.getInvoices(),
      ]);

      setTiers(tiersRes.data.tiers);
      if (currentRes.data) {
        setSubscription(currentRes.data);
      }
      setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (selectedTier: SubscriptionTier) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await subscriptionApi.subscribe({
        tier: selectedTier,
        billing_period: billingPeriod,
      });
      setSubscription(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to subscribe. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (selectedTier: SubscriptionTier) => {
    setActionLoading(true);
    setError('');
    try {
      const response = await subscriptionApi.upgrade(selectedTier);
      setSubscription(response.data);
    } catch (err: any) {
      // No subscription in DB yet — fall back to subscribe
      if (err?.response?.status === 404) {
        try {
          const response = await subscriptionApi.subscribe({
            tier: selectedTier,
            billing_period: billingPeriod,
          });
          setSubscription(response.data);
        } catch (subErr: any) {
          setError(subErr?.response?.data?.detail ?? 'Failed to subscribe. Please try again.');
        }
      } else {
        setError(err?.response?.data?.detail ?? 'Failed to upgrade. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const response = await subscriptionApi.cancel();
      setSubscription(response.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSubscription(null as any);
      } else {
        setError(err?.response?.data?.detail ?? 'Failed to cancel. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    setError('');
    try {
      const response = await subscriptionApi.reactivate();
      setSubscription(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to reactivate. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const tierIcons = {
    basic: Zap,
    pro: Sparkles,
    premium: Crown,
  };

  const TierIcon = tier ? tierIcons[tier] : Zap;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <>
        <Header title="Subscription" subtitle="Manage your subscription and billing" />
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-background-secondary rounded-xl" />
          <div className="h-96 bg-background-secondary rounded-xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Subscription" subtitle="Manage your subscription and billing" />

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
          {error}
        </div>
      )}

      {/* Current Plan */}
      {subscription && status === 'active' ? (
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center',
                  tier === 'basic' && 'bg-accent-secondary/10',
                  tier === 'pro' && 'bg-accent-primary/10',
                  tier === 'premium' && 'bg-warning/10'
                )}
              >
                <TierIcon
                  className={cn(
                    'w-8 h-8',
                    tier === 'basic' && 'text-accent-secondary',
                    tier === 'pro' && 'text-accent-primary',
                    tier === 'premium' && 'text-warning'
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-text-primary">
                    {tier ? TIER_DISPLAY_NAMES[tier] : 'Free'} Plan
                  </h2>
                  <Badge variant={status === 'active' ? 'positive' : 'neutral'}>
                    {status}
                  </Badge>
                  {subscription.cancelAtPeriodEnd && (
                    <Badge variant="negative">Canceling</Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {subscription.cancelAtPeriodEnd
                    ? `Access until ${formatDate(subscription.currentPeriodEnd)}`
                    : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {subscription.cancelAtPeriodEnd ? (
                <Button onClick={handleReactivate} isLoading={actionLoading}>
                  Reactivate Subscription
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={handleCancel} disabled={actionLoading}>
                    Cancel Subscription
                  </Button>
                  {tier !== 'premium' && (
                    <Button onClick={() => handleUpgrade('premium')} isLoading={actionLoading}>
                      Upgrade to Premium
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Billing Info */}
          <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Current Period</p>
                <p className="text-sm text-text-primary">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Payment Method</p>
                <p className="text-sm text-text-primary">•••• 4242</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Member Since</p>
                <p className="text-sm text-text-primary">{formatDate(subscription.createdAt)}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-8 border-accent-primary/30 bg-accent-primary/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">No Active Subscription</h3>
                <p className="text-sm text-text-secondary">
                  Subscribe to access all ClearFlow features
                </p>
              </div>
            </div>
            <Button>
              Choose a Plan <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader
          title={subscription ? 'Change Plan' : 'Choose a Plan'}
          actions={<PricingToggle value={billingPeriod} onChange={setBillingPeriod} />}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tierInfo) => (
            <PricingCard
              key={tierInfo.tier}
              tier={tierInfo}
              billingPeriod={billingPeriod}
              isCurrentPlan={tier === tierInfo.tier}
              onSelect={status === 'active' ? handleUpgrade : handleSubscribe}
              isLoading={actionLoading}
              disabled={tier === tierInfo.tier}
            />
          ))}
        </div>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader title="Billing History" />
        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/50">
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {invoice.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary font-medium">
                      ₦{invoice.amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={invoice.status === 'completed' ? 'positive' : 'neutral'}
                      >
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No billing history yet</p>
          </div>
        )}
      </Card>
    </>
  );
}
