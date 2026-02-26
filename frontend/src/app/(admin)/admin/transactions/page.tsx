'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api-client';
import { RefreshCw } from 'lucide-react';
import type { AdminTransaction } from '@/types';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listTransactions();
      setTransactions(response.data.transactions || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, 'positive' | 'negative' | 'neutral'> = {
      buy: 'negative',
      sell: 'positive',
      dividend: 'positive',
      deposit: 'positive',
      withdrawal: 'negative',
    };
    return map[type] || 'neutral';
  };

  return (
    <>
      <Header
        title="All Transactions"
        subtitle={`${totalCount} transactions across all users`}
        actions={
          <Button variant="secondary" onClick={loadTransactions}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader title="Transactions" actions={<Badge variant="neutral">{totalCount} total</Badge>} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Symbol</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4 font-medium text-sm">{tx.userName}</td>
                    <td className="py-3 px-4">
                      <Badge variant={typeBadge(tx.type)}>{tx.type.toUpperCase()}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{tx.symbol || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{tx.quantity || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {tx.price ? formatCurrency(tx.price) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-sm">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {new Date(tx.executedAt).toLocaleDateString()}
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
