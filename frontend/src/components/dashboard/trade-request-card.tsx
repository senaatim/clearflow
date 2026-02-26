'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from 'lucide-react';
import type { TradeRequest } from '@/types';

interface TradeRequestCardProps {
  trade: TradeRequest;
  onCancel?: (id: string) => void;
  onViewDetails?: (trade: TradeRequest) => void;
  isLoading?: boolean;
}

export function TradeRequestCard({
  trade,
  onCancel,
  onViewDetails,
  isLoading = false,
}: TradeRequestCardProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: 'Pending',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    confirmed: {
      icon: AlertCircle,
      label: 'Confirmed',
      color: 'text-accent-secondary',
      bgColor: 'bg-accent-secondary/10',
    },
    executed: {
      icon: CheckCircle,
      label: 'Executed',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      color: 'text-accent-danger',
      bgColor: 'bg-accent-danger/10',
    },
    canceled: {
      icon: XCircle,
      label: 'Canceled',
      color: 'text-text-muted',
      bgColor: 'bg-text-muted/10',
    },
  };

  const config = statusConfig[trade.status];
  const StatusIcon = config.icon;

  const isBuy = trade.action === 'buy';
  const ActionIcon = isBuy ? TrendingUp : TrendingDown;

  const formattedDate = new Date(trade.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4 md:p-5 hover:border-accent-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isBuy ? 'bg-success/10' : 'bg-accent-danger/10'
            )}
          >
            <ActionIcon
              className={cn('w-5 h-5', isBuy ? 'text-success' : 'text-accent-danger')}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">{trade.symbol}</span>
              <Badge
                variant={isBuy ? 'positive' : 'negative'}
                className="text-xs"
              >
                {trade.action.toUpperCase()}
              </Badge>
            </div>
            {trade.companyName && (
              <p className="text-sm text-text-secondary">{trade.companyName}</p>
            )}
          </div>
        </div>

        <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full', config.bgColor)}>
          <StatusIcon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-text-muted mb-1">Quantity</p>
          <p className="text-sm font-medium text-text-primary">{trade.quantity} shares</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Order Type</p>
          <p className="text-sm font-medium text-text-primary capitalize">{trade.orderType}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">
            {trade.status === 'executed' ? 'Executed Price' : 'Estimated Price'}
          </p>
          <p className="text-sm font-medium text-text-primary">
            ${(trade.executedPrice || trade.estimatedPrice || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">Total</p>
          <p className="text-sm font-medium text-text-primary">
            ${(trade.estimatedTotal || (trade.executedPrice || 0) * (trade.executedQuantity || trade.quantity)).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Risk Level and Growth Outlook */}
      {(trade.riskLevel || trade.growthOutlook) && (
        <div className="flex gap-3 mb-4">
          {trade.riskLevel && (
            <div
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium',
                trade.riskLevel === 'low' && 'bg-success/10 text-success',
                trade.riskLevel === 'medium' && 'bg-warning/10 text-warning',
                trade.riskLevel === 'high' && 'bg-accent-danger/10 text-accent-danger'
              )}
            >
              {trade.riskLevel.charAt(0).toUpperCase() + trade.riskLevel.slice(1)} Risk
            </div>
          )}
          {trade.growthOutlook && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-primary/10 text-accent-primary">
              {trade.growthOutlook === 'short_term' ? 'Short-term' : 'Long-term'} Growth
            </div>
          )}
        </div>
      )}

      {/* Broker Notes */}
      {trade.brokerNotes && (
        <div className="bg-background-tertiary rounded-lg p-3 mb-4">
          <p className="text-xs text-text-muted mb-1">Broker Notes</p>
          <p className="text-sm text-text-primary">{trade.brokerNotes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-xs text-text-muted">{formattedDate}</p>
        <div className="flex items-center gap-2">
          {trade.status === 'pending' && onCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(trade.id)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(trade)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface TradeRequestListProps {
  trades: TradeRequest[];
  onCancel?: (id: string) => void;
  onViewDetails?: (trade: TradeRequest) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function TradeRequestList({
  trades,
  onCancel,
  onViewDetails,
  isLoading = false,
  emptyMessage = 'No trade requests found',
}: TradeRequestListProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <TradeRequestCard
          key={trade.id}
          trade={trade}
          onCancel={onCancel}
          onViewDetails={onViewDetails}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
