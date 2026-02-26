'use client';

import { useState } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { BrokerDisclaimer } from '@/components/ui/disclaimer';
import { cn } from '@/lib/utils';
import type { Recommendation, Portfolio } from '@/types';

interface BrokerExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation;
  portfolios: Portfolio[];
  onSubmit: (data: {
    recommendationId: string;
    portfolioId: string;
    quantity: number;
    orderType: string;
    limitPrice?: number;
    userNotes?: string;
  }) => Promise<void>;
}

export function BrokerExecutionModal({
  isOpen,
  onClose,
  recommendation,
  portfolios,
  onSubmit,
}: BrokerExecutionModalProps) {
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const details = recommendation.details || {};
  const symbol = details.symbol as string || 'N/A';
  const companyName = details.company_name as string || recommendation.title;
  const currentPrice = details.current_price as number || details.estimated_price as number;
  const riskLevel = details.risk_level as string;
  const growthOutlook = details.growth_outlook as string;

  const estimatedTotal = currentPrice && quantity ? currentPrice * parseFloat(quantity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit({
        recommendationId: recommendation.id,
        portfolioId,
        quantity: parseFloat(quantity),
        orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
        userNotes: userNotes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit trade request');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBuy = recommendation.type === 'buy' || recommendation.type === 'opportunity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background-secondary border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background-secondary border-b border-border p-4 md:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Request Broker Execution</h2>
            <p className="text-sm text-text-secondary">Review and submit your trade request</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* Stock Info */}
          <div className="bg-background-tertiary rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-text-primary">{symbol}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      isBuy
                        ? 'bg-success/20 text-success'
                        : 'bg-accent-danger/20 text-accent-danger'
                    )}
                  >
                    {isBuy ? 'BUY' : 'SELL'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{companyName}</p>
              </div>
              <div className="text-right">
                {currentPrice && (
                  <p className="text-lg font-semibold text-text-primary">
                    ${currentPrice.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-text-muted">Current Price</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              {riskLevel && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Risk Level</p>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      riskLevel === 'low' && 'text-success',
                      riskLevel === 'medium' && 'text-warning',
                      riskLevel === 'high' && 'text-accent-danger'
                    )}
                  >
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  </span>
                </div>
              )}
              {growthOutlook && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Growth Outlook</p>
                  <span className="text-sm font-medium text-text-primary flex items-center gap-1">
                    {growthOutlook === 'short_term' ? (
                      <>
                        <TrendingUp className="w-3 h-3" /> Short-term
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3" /> Long-term
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">AI Analysis</p>
                <p className="text-sm text-text-secondary">{recommendation.description}</p>
              </div>
            </div>
          </div>

          {/* Portfolio Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Portfolio
            </label>
            <Select
              value={portfolioId}
              onChange={(e) => setPortfolioId(e.target.value)}
              options={portfolios.map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Quantity (Shares)
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Order Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                  orderType === 'market'
                    ? 'bg-accent-primary text-background-primary'
                    : 'bg-background-tertiary text-text-secondary hover:text-text-primary'
                )}
              >
                Market Order
              </button>
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
                  orderType === 'limit'
                    ? 'bg-accent-primary text-background-primary'
                    : 'bg-background-tertiary text-text-secondary hover:text-text-primary'
                )}
              >
                Limit Order
              </button>
            </div>
          </div>

          {/* Limit Price */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Limit Price ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="Enter limit price"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Any special instructions for the broker..."
              className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Estimated Total */}
          {estimatedTotal > 0 && (
            <div className="bg-background-tertiary rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Estimated Total</span>
              <span className="text-xl font-bold text-text-primary">
                ₦{estimatedTotal.toFixed(2)}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-accent-danger/10 border border-accent-danger/20 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent-danger flex-shrink-0" />
              <p className="text-sm text-accent-danger">{error}</p>
            </div>
          )}

          {/* Disclaimer */}
          <BrokerDisclaimer />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
              Submit Trade Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
