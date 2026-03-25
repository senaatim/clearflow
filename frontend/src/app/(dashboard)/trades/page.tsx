'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { TradeRequestList } from '@/components/dashboard/trade-request-card';
import { FeatureGate } from '@/components/ui/feature-gate';
import { BrokerDisclaimer } from '@/components/ui/disclaimer';
import { tradeApi } from '@/lib/api-client';
import { Features } from '@/stores/subscription-store';
import {
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TradeRequest, TradeRequestStatus } from '@/types';

type FilterStatus = TradeRequestStatus | 'all';

function TradeRequestsContent() {
  const [trades, setTrades] = useState<TradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    executed: 0,
    canceled: 0,
  });

  useEffect(() => {
    loadTrades();
  }, [filter]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { statusFilter: filter } : {};
      const response = await tradeApi.list(params);
      setTrades(response.data.trades || []);
      setStats({
        total: response.data.totalCount || 0,
        pending: response.data.pendingCount || 0,
        executed: response.data.executedCount || 0,
        canceled: 0,
      });
    } catch (error) {
      console.error('Failed to load trades:', error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTrade = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this trade request?')) {
      return;
    }

    try {
      await tradeApi.cancel(id);
      loadTrades();
    } catch (error) {
      console.error('Failed to cancel trade:', error);
    }
  };

  const handleViewDetails = (trade: TradeRequest) => {
    console.log('View details:', trade);
  };

  const filterOptions: { value: FilterStatus; label: string; icon: typeof Clock }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'executed', label: 'Executed', icon: CheckCircle },
    { value: 'canceled', label: 'Canceled', icon: XCircle },
  ];

  return (
    <>
      <Header
        title="Trade Requests"
        subtitle="Manage your broker-assisted trade requests"
        actions={
          <Button onClick={loadTrades} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard label="Total Requests" value={stats.total.toString()} />
        <StatCard label="Pending" value={stats.pending.toString()} />
        <StatCard label="Executed" value={stats.executed.toString()} />
        <StatCard label="Canceled" value={stats.canceled.toString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === option.value
                ? 'bg-accent-primary text-background-primary'
                : 'bg-background-secondary text-text-secondary hover:text-text-primary'
            )}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Trade List */}
      <Card>
        <CardHeader
          title={`${filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} Trade Requests`}
          actions={
            trades.length > 0 && (
              <Badge variant="neutral">{trades.length} requests</Badge>
            )
          }
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <TradeRequestList
            trades={trades}
            onCancel={handleCancelTrade}
            onViewDetails={handleViewDetails}
            emptyMessage={
              filter === 'all'
                ? 'No trade requests yet. Request broker execution from your recommendations.'
                : `No ${filter} trade requests found.`
            }
          />
        )}
      </Card>

      {/* Disclaimer */}
      <div className="mt-6">
        <BrokerDisclaimer />
      </div>
    </>
  );
}

export default function TradesPage() {
  return (
    <FeatureGate feature={Features.BROKER_EXECUTION}>
      <TradeRequestsContent />
    </FeatureGate>
  );
}
