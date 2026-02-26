'use client';

import { useState, useEffect } from 'react';
import { Download, Plus, FolderPlus } from 'lucide-react';
import { Header, Button } from '@/components/layout/header';
import { StatCard } from '@/components/ui/stat-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel';
import { AssetAllocation } from '@/components/dashboard/asset-allocation';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { portfolioApi } from '@/lib/api-client';
import type { Portfolio } from '@/types';

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await portfolioApi.list();
        setPortfolios(response.data || []);
      } catch (err) {
        console.error('Failed to load portfolios:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-accent-danger mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // No portfolios yet — show empty state
  if (portfolios.length === 0) {
    return (
      <>
        <Header title="Portfolio Overview" subtitle="Get started with ClearFlow" />
        <div className="min-h-[50vh] flex items-center justify-center">
          <Card className="p-10 text-center max-w-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FolderPlus className="w-8 h-8 text-accent-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Create Your First Portfolio</h2>
            <p className="text-text-secondary mb-6">
              Start tracking your investments by creating a portfolio. Add your stocks, ETFs, bonds, and more.
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/portfolio'}>
              <Plus className="w-4 h-4" />
              Create Portfolio
            </Button>
          </Card>
        </div>
      </>
    );
  }

  // Compute aggregate stats from portfolios
  const totalValue = portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalReturns = portfolios.reduce((sum, p) => sum + (p.totalReturn || 0), 0);
  const returnPercentage = totalValue > 0 ? ((totalReturns / (totalValue - totalReturns)) * 100) : 0;
  const primaryPortfolio = portfolios[0];

  return (
    <>
      <Header
        title="Portfolio Overview"
        subtitle={`${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''} tracked`}
        actions={
          <>
            <Button variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="primary" onClick={() => window.location.href = '/portfolio'}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Invest More</span>
            </Button>
          </>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          label="Total Portfolio Value"
          value={formatCurrency(totalValue)}
          change={totalReturns >= 0 ? `+${returnPercentage.toFixed(1)}%` : `${returnPercentage.toFixed(1)}%`}
          changeType={totalReturns >= 0 ? 'positive' : 'negative'}
          subtitle={`${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`}
          delay={0.1}
        />
        <StatCard
          label="Total Returns"
          value={formatCurrency(totalReturns)}
          change={totalReturns >= 0 ? `+${returnPercentage.toFixed(1)}%` : `${returnPercentage.toFixed(1)}%`}
          changeType={totalReturns >= 0 ? 'positive' : 'negative'}
          subtitle="All time"
          delay={0.2}
        />
        <StatCard
          label="Primary Portfolio"
          value={primaryPortfolio.name}
          change={primaryPortfolio.type}
          changeType="positive"
          subtitle={formatCurrency(primaryPortfolio.totalValue || 0)}
          delay={0.3}
        />
        <StatCard
          label="Portfolios"
          value={`${portfolios.length}`}
          change="Active"
          changeType="positive"
          subtitle={portfolios.map(p => p.name).join(', ')}
          delay={0.4}
        />
      </div>

      {/* Dashboard Grid - Performance & Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="xl:col-span-2">
          <PerformanceChart portfolioId={primaryPortfolio.id} />
        </div>
        <div>
          <AIInsightsPanel />
        </div>
      </div>

      {/* Bottom Grid - Allocation & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className="xl:col-span-2">
          <AssetAllocation portfolioId={primaryPortfolio.id} />
        </div>
        <div>
          <ActivityFeed portfolioId={primaryPortfolio.id} />
        </div>
      </div>
    </>
  );
}
