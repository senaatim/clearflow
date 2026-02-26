'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api-client';
import { RefreshCw, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminTrade } from '@/types';

type FilterStatus = 'all' | 'pending' | 'executed' | 'rejected';

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Execute modal state
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executeForm, setExecuteForm] = useState({
    executedPrice: '',
    executedQuantity: '',
    executionFees: '',
    brokerNotes: '',
  });

  // Reject modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    loadTrades();
  }, [filter]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { statusFilter: filter } : {};
      const response = await adminApi.listTrades(params);
      setTrades(response.data.trades || []);
      setTotalCount(response.data.totalCount || 0);
      setPendingCount(response.data.pendingCount || 0);
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!executingId || !executeForm.executedPrice) return;
    try {
      await adminApi.executeTrade(executingId, {
        executedPrice: parseFloat(executeForm.executedPrice),
        executedQuantity: executeForm.executedQuantity ? parseFloat(executeForm.executedQuantity) : undefined,
        executionFees: executeForm.executionFees ? parseFloat(executeForm.executionFees) : 0,
        brokerNotes: executeForm.brokerNotes || undefined,
      });
      setExecutingId(null);
      setExecuteForm({ executedPrice: '', executedQuantity: '', executionFees: '', brokerNotes: '' });
      loadTrades();
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      await adminApi.rejectTrade(rejectingId, { brokerNotes: rejectNotes || undefined });
      setRejectingId(null);
      setRejectNotes('');
      loadTrades();
    } catch (error) {
      console.error('Failed to reject trade:', error);
    }
  };

  const startExecute = (trade: AdminTrade) => {
    setExecutingId(trade.id);
    setExecuteForm({
      executedPrice: trade.estimatedPrice?.toString() || '',
      executedQuantity: trade.quantity.toString(),
      executionFees: '',
      brokerNotes: '',
    });
  };

  const filterOptions: { value: FilterStatus; label: string; icon: typeof Clock }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'executed', label: 'Executed', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'positive' | 'negative' | 'warning' | 'neutral'> = {
      pending: 'warning',
      executed: 'positive',
      rejected: 'negative',
      canceled: 'neutral',
      confirmed: 'neutral',
    };
    return map[status] || 'neutral';
  };

  return (
    <>
      <Header
        title="Trade Requests"
        subtitle={`${pendingCount} pending trades`}
        actions={
          <Button variant="secondary" onClick={loadTrades}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

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

      {/* Execute Modal */}
      {executingId && (
        <Card className="mb-6 border-2 border-accent-primary">
          <CardHeader title="Execute Trade" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Executed Price *</label>
              <input
                type="number"
                step="0.01"
                value={executeForm.executedPrice}
                onChange={(e) => setExecuteForm({ ...executeForm, executedPrice: e.target.value })}
                className="w-full p-2.5 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                value={executeForm.executedQuantity}
                onChange={(e) => setExecuteForm({ ...executeForm, executedQuantity: e.target.value })}
                className="w-full p-2.5 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Execution Fees</label>
              <input
                type="number"
                step="0.01"
                value={executeForm.executionFees}
                onChange={(e) => setExecuteForm({ ...executeForm, executionFees: e.target.value })}
                className="w-full p-2.5 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Broker Notes</label>
              <input
                type="text"
                value={executeForm.brokerNotes}
                onChange={(e) => setExecuteForm({ ...executeForm, brokerNotes: e.target.value })}
                className="w-full p-2.5 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleExecute}>
              <CheckCircle className="w-4 h-4" />
              Confirm Execution
            </Button>
            <Button variant="secondary" onClick={() => setExecutingId(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <Card className="mb-6 border-2 border-accent-danger">
          <CardHeader title="Reject Trade" />
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            rows={3}
            className="w-full p-3 bg-background-tertiary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none mb-4"
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject}>
              <XCircle className="w-4 h-4" />
              Confirm Rejection
            </Button>
            <Button variant="secondary" onClick={() => { setRejectingId(null); setRejectNotes(''); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader title="All Trade Requests" actions={<Badge variant="neutral">{totalCount} total</Badge>} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No trade requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Symbol</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Est. Price</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{trade.userName}</div>
                      <div className="text-xs text-text-muted">{trade.userEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={trade.action === 'buy' ? 'positive' : trade.action === 'sell' ? 'negative' : 'neutral'}>
                        {trade.action.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-sm">{trade.symbol}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{trade.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {trade.estimatedPrice ? formatCurrency(trade.estimatedPrice) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusBadge(trade.status)}>{trade.status.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {new Date(trade.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {trade.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startExecute(trade)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg text-success bg-success/10 hover:bg-success/20 transition-colors"
                          >
                            Execute
                          </button>
                          <button
                            onClick={() => setRejectingId(trade.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg text-accent-danger bg-accent-danger/10 hover:bg-accent-danger/20 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
