'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { screenerApi } from '@/lib/api-client';
import { Search, RefreshCw, TrendingUp, TrendingDown, Lock, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change_pct: number;
  market_cap: number;
  pe_ratio: number;
  revenue_growth: number;
  dividend_yield: number;
  health_score: number;
  volume: number;
}

function fmt(n: number | undefined | null, dec = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-NG', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtCap(n: number | undefined | null) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e12) return `₦${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `₦${(n / 1e9).toFixed(1)}B`;
  return `₦${(n / 1e6).toFixed(0)}M`;
}

function HealthScore({ score }: { score: number }) {
  const colour =
    score >= 80 ? 'text-success' :
    score >= 65 ? 'text-warning' : 'text-accent-danger';
  return <span className={`font-bold text-sm ${colour}`}>{score}</span>;
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [isLimited, setIsLimited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [sector, setSector] = useState('');
  const [minPe, setMinPe] = useState('');
  const [maxPe, setMaxPe] = useState('');
  const [minHealth, setMinHealth] = useState('');
  const [minDividend, setMinDividend] = useState('');
  const [minRevenueGrowth, setMinRevenueGrowth] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { sortBy };
      if (sector) params.sector = sector;
      if (minPe) params.minPe = parseFloat(minPe);
      if (maxPe) params.maxPe = parseFloat(maxPe);
      if (minHealth) params.minHealth = parseInt(minHealth);
      if (minDividend) params.minDividend = parseFloat(minDividend);
      if (minRevenueGrowth) params.minRevenueGrowth = parseFloat(minRevenueGrowth);

      const res = await screenerApi.getStocks(params);
      setStocks(res.data.stocks || []);
      setIsLimited(res.data.isLimited);
      setSectors(res.data.sectors || []);
    } catch (err) {
      console.error('Failed to load stocks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadStocks();
  };

  const clearFilters = () => {
    setSector(''); setMinPe(''); setMaxPe('');
    setMinHealth(''); setMinDividend(''); setMinRevenueGrowth('');
    setSortBy('market_cap');
  };

  return (
    <>
      <Header
        title="Smart Stock Screener"
        subtitle="Filter and discover NGX-listed stocks"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="secondary" onClick={loadStocks}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {isLimited && (
        <div className="mb-6 p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-accent-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">Free plan: 5 results, sector filter only</p>
              <p className="text-xs text-text-muted">Upgrade to Pro for full screener with P/E, dividend, health score & growth filters.</p>
            </div>
          </div>
          <Link href="/subscription">
            <Button variant="primary" className="text-xs whitespace-nowrap">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleFilter} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Sector</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">All Sectors</option>
                  {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={isLimited ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-xs text-text-muted mb-1 block">Min P/E {isLimited && <Lock className="w-3 h-3 inline" />}</label>
                <input type="number" step="0.1" value={minPe} onChange={(e) => setMinPe(e.target.value)} placeholder="e.g. 3" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
              </div>

              <div className={isLimited ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-xs text-text-muted mb-1 block">Max P/E {isLimited && <Lock className="w-3 h-3 inline" />}</label>
                <input type="number" step="0.1" value={maxPe} onChange={(e) => setMaxPe(e.target.value)} placeholder="e.g. 20" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
              </div>

              <div className={isLimited ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-xs text-text-muted mb-1 block">Min Health Score {isLimited && <Lock className="w-3 h-3 inline" />}</label>
                <input type="number" step="1" min="0" max="100" value={minHealth} onChange={(e) => setMinHealth(e.target.value)} placeholder="e.g. 75" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
              </div>

              <div className={isLimited ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-xs text-text-muted mb-1 block">Min Dividend Yield % {isLimited && <Lock className="w-3 h-3 inline" />}</label>
                <input type="number" step="0.1" value={minDividend} onChange={(e) => setMinDividend(e.target.value)} placeholder="e.g. 5" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
              </div>

              <div className={isLimited ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-xs text-text-muted mb-1 block">Min Revenue Growth % {isLimited && <Lock className="w-3 h-3 inline" />}</label>
                <input type="number" step="0.1" value={minRevenueGrowth} onChange={(e) => setMinRevenueGrowth(e.target.value)} placeholder="e.g. 20" className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block">Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-background-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
                  <option value="market_cap">Market Cap</option>
                  <option value="pe_ratio">P/E Ratio</option>
                  <option value="dividend_yield">Dividend Yield</option>
                  <option value="revenue_growth">Revenue Growth</option>
                  <option value="health_score">Health Score</option>
                  <option value="change_pct">Day Change</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                <Search className="w-4 h-4" />
                Apply Filters
              </Button>
              <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted">Symbol</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-text-muted">Sector</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Price (₦)</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Change</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Mkt Cap</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">P/E</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Rev Growth</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Div Yield</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">Health</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => (
                  <tr key={s.symbol} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/health-cards/${s.symbol}`} className="hover:text-accent-primary transition-colors">
                        <div className="font-mono font-semibold text-sm">{s.symbol}</div>
                        <div className="text-xs text-text-muted truncate max-w-[140px]">{s.name}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-background-tertiary px-2 py-0.5 rounded-full text-text-secondary">{s.sector}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{fmt(s.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium flex items-center justify-end gap-0.5 ${(s.change_pct ?? 0) >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                        {(s.change_pct ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {(s.change_pct ?? 0) >= 0 ? '+' : ''}{fmt(s.change_pct)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-text-secondary font-mono">{fmtCap(s.market_cap)}</td>
                    <td className="py-3 px-4 text-right text-sm font-mono">{fmt(s.pe_ratio, 1)}x</td>
                    <td className="py-3 px-4 text-right text-sm text-success font-mono">+{fmt(s.revenue_growth)}%</td>
                    <td className="py-3 px-4 text-right text-sm font-mono">{fmt(s.dividend_yield)}%</td>
                    <td className="py-3 px-4 text-right"><HealthScore score={s.health_score} /></td>
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
