'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Building2, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { fundApi } from '@/lib/api-client';
import type { FundRequest } from '@/types';

const BANK_DETAILS = {
  accountName: 'Jbryanson Globals Limited',
  accountNumber: '1224017438',
  bank: 'Zenith Bank',
};

const quickAmounts = [1000, 2500, 5000, 10000];

export default function AddFundsPage() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const selectedMethod = 'bank';
  const [userNotes, setUserNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fundApi.list();
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error('Failed to load fund requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const num = parseFloat(value);
    setSelectedAmount(isNaN(num) ? null : num);
  };

  const handleSubmit = async () => {
    if (!selectedAmount || selectedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await fundApi.create({
        amount: selectedAmount,
        method: selectedMethod,
        userNotes: userNotes || undefined,
      });
      setSuccessMessage('Deposit request submitted successfully! Our team will review it shortly.');
      setCustomAmount('');
      setSelectedAmount(null);
      setUserNotes('');
      loadRequests();
    } catch (err) {
      setError('Failed to submit deposit request. Please try again.');
      console.error('Failed to create fund request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this deposit request?')) return;
    try {
      await fundApi.cancel(id);
      loadRequests();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'positive' | 'negative' | 'warning' | 'neutral'; icon: typeof Clock }> = {
      pending: { variant: 'warning', icon: Clock },
      approved: { variant: 'positive', icon: CheckCircle },
      rejected: { variant: 'negative', icon: XCircle },
      canceled: { variant: 'neutral', icon: XCircle },
    };
    return map[status] || { variant: 'neutral' as const, icon: Clock };
  };

  return (
    <>
      <Header
        title="Add Funds"
        subtitle="Submit a deposit request to fund your account"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Funding Form */}
        <div className="lg:col-span-2">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-success text-sm">Request Submitted</div>
                <p className="text-sm text-text-secondary mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
              {error}
            </div>
          )}

          <Card className="mb-8">
            <CardHeader title="Deposit Amount" />
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-text-muted">{'\u20A6'}</div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 bg-background-tertiary border border-border rounded-xl text-4xl font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors font-mono"
                />
              </div>

              <div className="flex gap-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className={`flex-1 py-3 bg-background-tertiary border rounded-lg font-mono font-semibold transition-colors ${
                      selectedAmount === amount
                        ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                        : 'border-border hover:border-accent-primary hover:bg-accent-primary/5'
                    }`}
                  >
                    {'\u20A6'}{amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="mb-8">
            <CardHeader title="Payment Method" />
            <div className="flex items-center gap-4 p-4 bg-background-tertiary rounded-xl border-2 border-accent-primary mb-4">
              <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-0.5">Bank Transfer</div>
                <div className="text-sm text-text-secondary">Transfer directly from your bank account — Free</div>
              </div>
              <div className="text-xs text-text-muted">1–3 business days</div>
            </div>

            <div className="bg-background-tertiary rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Transfer to this account</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Bank</span>
                <span className="text-sm font-semibold text-text-primary">{BANK_DETAILS.bank}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Account Name</span>
                <span className="text-sm font-semibold text-text-primary">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Account Number</span>
                <span className="text-sm font-bold font-mono text-accent-primary tracking-widest">{BANK_DETAILS.accountNumber}</span>
              </div>
              <p className="text-xs text-text-muted pt-2 border-t border-border">
                Use your registered name or email as the transfer narration so we can match your payment quickly.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Additional Notes (Optional)" />
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add any notes about this deposit..."
              rows={3}
              className="w-full p-3 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none mb-4"
            />
            <Button
              className="w-full"
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Submit Deposit Request
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>

        {/* Request History */}
        <div>
          <Card>
            <CardHeader title="Your Deposit Requests" />
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-background-tertiary rounded animate-pulse" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center text-text-secondary text-sm">
                No deposit requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => {
                  const badge = statusBadge(req.status);
                  return (
                    <div key={req.id} className="p-3 bg-background-tertiary rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-semibold text-sm">{formatCurrency(req.amount)}</span>
                        <Badge variant={badge.variant}>{req.status.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="text-accent-danger hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {req.adminNotes && (
                        <div className="mt-2 text-xs text-text-secondary bg-background-secondary rounded p-2">
                          {req.adminNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="mt-6 p-4 bg-accent-primary/10 rounded-xl">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-accent-primary mb-1">How it works</div>
                <p className="text-sm text-text-secondary">
                  Submit a deposit request and our broker will review and process it. You'll be notified once your funds are credited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
