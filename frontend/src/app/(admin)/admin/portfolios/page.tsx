'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api-client';
import { RefreshCw } from 'lucide-react';
import type { AdminPortfolio } from '@/types';

export default function AdminPortfoliosPage() {
  const [portfolios, setPortfolios] = useState<AdminPortfolio[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listPortfolios();
      setPortfolios(response.data.portfolios || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header
        title="All Portfolios"
        subtitle={`${totalCount} portfolios across all users`}
        actions={
          <Button variant="secondary" onClick={loadPortfolios}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader title="Portfolios" actions={<Badge variant="neutral">{totalCount} total</Badge>} />
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : portfolios.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No portfolios found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Owner</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Portfolio Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Currency</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Created</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((portfolio) => (
                  <tr key={portfolio.id} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{portfolio.userName}</div>
                      <div className="text-xs text-text-muted">{portfolio.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-sm">{portfolio.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{portfolio.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{portfolio.currency}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-sm">
                      {portfolio.totalValue ? formatCurrency(portfolio.totalValue) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary font-mono">
                      {new Date(portfolio.createdAt).toLocaleDateString()}
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
