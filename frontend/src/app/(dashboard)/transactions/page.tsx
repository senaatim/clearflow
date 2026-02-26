'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter, RefreshCw } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { transactionApi, portfolioApi } from '@/lib/api-client';
import type { Transaction, Portfolio } from '@/types';

const typeLabels: Record<string, { label: string; variant: 'positive' | 'negative' | 'neutral' }> = {
  buy: { label: 'BUY', variant: 'negative' },
  sell: { label: 'SELL', variant: 'positive' },
  dividend: { label: 'DIVIDEND', variant: 'positive' },
  deposit: { label: 'DEPOSIT', variant: 'positive' },
  withdrawal: { label: 'WITHDRAWAL', variant: 'negative' },
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId) {
      loadTransactions();
    }
  }, [selectedPortfolioId]);

  const loadPortfolios = async () => {
    try {
      const response = await portfolioApi.list();
      const data = response.data || [];
      setPortfolios(data);
      if (data.length > 0) {
        setSelectedPortfolioId(data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load portfolios:', err);
      setError('Failed to load portfolios');
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await transactionApi.list(selectedPortfolioId);
      setTransactions(response.data.transactions || response.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute summary stats from real data
  const totalDeposits = transactions
    .filter((tx) => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.totalAmount, 0);
  const totalInvested = transactions
    .filter((tx) => tx.type === 'buy')
    .reduce((sum, tx) => sum + Math.abs(tx.totalAmount), 0);
  const totalDividends = transactions
    .filter((tx) => tx.type === 'dividend')
    .reduce((sum, tx) => sum + tx.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <>
        <Header title="Transaction History" subtitle="View all your portfolio transactions" />
        <div className="min-h-[40vh] flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <p className="text-accent-danger mb-4">{error}</p>
            <Button variant="secondary" onClick={() => selectedPortfolioId ? loadTransactions() : loadPortfolios()}>
              Retry
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Transaction History"
        subtitle="View all your portfolio transactions"
        actions={
          <div className="flex items-center gap-3">
            {portfolios.length > 1 && (
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <Button variant="secondary" onClick={loadTransactions}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Total Deposits</div>
          <div className="text-3xl font-bold text-success">{formatCurrency(totalDeposits)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Total Invested</div>
          <div className="text-3xl font-bold">{formatCurrency(totalInvested)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Dividends Received</div>
          <div className="text-3xl font-bold text-success">{formatCurrency(totalDividends)}</div>
        </Card>
        <Card className="p-6">
          <div className="text-text-muted text-sm mb-2">Transactions</div>
          <div className="text-3xl font-bold">{transactions.length}</div>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader title="All Transactions" />
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">
            No transactions found for this portfolio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Description</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Shares</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Price</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Amount</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const typeInfo = typeLabels[tx.type] || { label: tx.type.toUpperCase(), variant: 'neutral' as const };
                  const isPositive = tx.type === 'sell' || tx.type === 'dividend' || tx.type === 'deposit';
                  return (
                    <tr key={tx.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                      <td className="py-4 px-4 font-mono text-sm">
                        {new Date(tx.executedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        {tx.symbol ? (
                          <div>
                            <span className="font-mono font-semibold">{tx.symbol}</span>
                            {tx.type === 'buy' && <span className="text-text-secondary"> - Purchase</span>}
                            {tx.type === 'sell' && <span className="text-text-secondary"> - Sale</span>}
                            {tx.type === 'dividend' && <span className="text-text-secondary"> - Dividend</span>}
                          </div>
                        ) : (
                          <span className="text-text-secondary">{tx.notes || tx.type}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        {tx.quantity || '-'}
                      </td>
                      <td className="py-4 px-4 text-right font-mono">
                        {tx.price ? formatCurrency(tx.price) : '-'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPositive ? (
                            <ArrowDownRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-accent-danger" />
                          )}
                          <span className={`font-mono font-semibold ${isPositive ? 'text-success' : 'text-text-primary'}`}>
                            {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.totalAmount))}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Badge variant="positive">completed</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
