'use client';

import { useState, useEffect } from 'react';
import { Download, Plus, FolderPlus, ExternalLink } from 'lucide-react';
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

interface Broker {
  name: string;
  tagline: string;
  description: string;
  color: string;
  url?: string;
  referralCode?: string;
  androidUrl?: string;
  iosUrl?: string;
}

const BROKERS: Broker[] = [
  {
    name: 'Bamboo',
    tagline: 'Join Bamboo and start your journey to the life of your dreams.',
    description: 'Invest in the US and Nigerian stock market and explore other investment options.',
    color: '#00C875',
    referralCode: 'john894183',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.invest.bamboo&referrer=john894183',
    iosUrl: 'https://apps.apple.com/app/id1474833078',
  },
  {
    name: 'Cowrywise',
    tagline: 'Grow your wealth consistently.',
    description: 'Savings, mutual funds & more.',
    color: '#29ABE2',
    url: 'https://cowrywise.com',
  },
  {
    name: 'Sycamore',
    tagline: 'Invest smart, grow faster.',
    description: 'Smart investing for Nigerians.',
    color: '#9B59B6',
    url: 'https://sycamore.ng',
  },
  {
    name: 'Afrivest',
    tagline: 'Your trusted stockbroker.',
    description: 'Full-service stockbroking & research.',
    color: '#FFBB00',
    url: 'https://afrivest.net',
  },
];

function BrokerCard({ broker }: { broker: Broker }) {
  const hasPlatformLinks = broker.androidUrl || broker.iosUrl;

  return (
    <div className="flex flex-col gap-3 p-4 bg-background-tertiary rounded-xl border border-border hover:border-accent-primary/40 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: broker.color }}
        >
          {broker.name[0]}
        </div>
        <span className="text-xs font-semibold" style={{ color: broker.color }}>{broker.name}</span>
      </div>

      {/* Text */}
      <div>
        <p className="text-xs font-medium text-text-primary leading-snug">{broker.tagline}</p>
        <p className="text-xs text-text-muted mt-1 leading-snug">{broker.description}</p>
      </div>

      {/* Referral code */}
      {broker.referralCode && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-background-primary rounded-lg border border-border">
          <span className="text-xs text-text-muted">Code:</span>
          <span className="text-xs font-mono font-bold text-accent-primary">{broker.referralCode}</span>
        </div>
      )}

      {/* CTA links */}
      {hasPlatformLinks ? (
        <div className="flex gap-2 mt-auto">
          {broker.androidUrl && (
            <a
              href={broker.androidUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-background-primary border border-border hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Android
            </a>
          )}
          {broker.iosUrl && (
            <a
              href={broker.iosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-background-primary border border-border hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> iOS
            </a>
          )}
        </div>
      ) : broker.url ? (
        <a
          href={broker.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-background-primary border border-border hover:border-accent-primary text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Visit Website
        </a>
      ) : null}
    </div>
  );
}

function BrokerPanel() {
  return (
    <Card className="mt-6 md:mt-8 p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold">Recommended Brokers</div>
        <div className="text-xs text-text-muted mt-0.5">Open an account and start investing today</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BROKERS.map((broker) => (
          <BrokerCard key={broker.name} broker={broker} />
        ))}
      </div>
    </Card>
  );
}

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
        <BrokerPanel />
      </>
    );
  }

  // Compute aggregate stats from portfolios
  const totalValue = portfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalReturns = portfolios.reduce((sum, p) => sum + (p.totalReturn || 0), 0);
  const returnPercentage = totalValue > 0 ? ((totalReturns / (totalValue - totalReturns)) * 100) : 0;
  const primaryPortfolio = portfolios[0];

  const handleExport = () => {
    const headers = ['Name', 'Type', 'Currency', 'Total Value', 'Total Return', 'Return %', 'Created At'];
    const rows = portfolios.map(p => [
      p.name,
      p.type,
      p.currency,
      (p.totalValue ?? 0).toFixed(2),
      (p.totalReturn ?? 0).toFixed(2),
      (p.returnPercentage ?? 0).toFixed(2) + '%',
      new Date(p.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearflow-portfolios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header
        title="Portfolio Overview"
        subtitle={`${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''} tracked`}
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
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

      <BrokerPanel />
    </>
  );
}
