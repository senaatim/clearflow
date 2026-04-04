'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ngxApi } from '@/lib/api-client';
import { TrendingUp, TrendingDown, RefreshCw, Lock, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface IndexSummary {
  index: { name: string; value: number; change: number; changePct: number; ytdChangePct: number };
  marketCapTrn: number; volumeBnUnits: number; valueTradedBnNgn: number; deals: number;
  advancers: number; decliners: number; unchanged: number;
  sectorIndices: { name: string; value: number; changePct: number }[];
}

interface MoverStock { symbol: string; name: string; price: number; changePct: number; volume?: number }
interface Movers { topGainers: MoverStock[]; topLosers: MoverStock[]; mostActive: MoverStock[] }

function fmt(n: number | undefined | null, dec = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-NG', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function ChangeCell({ pct }: { pct: number | undefined | null }) {
  const val = pct ?? 0;
  return (
    <span className={`text-sm font-medium flex items-center gap-0.5 ${val >= 0 ? 'text-success' : 'text-accent-danger'}`}>
      {val >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {val >= 0 ? '+' : ''}{fmt(pct)}%
    </span>
  );
}

export default function NgxPage() {
  const [summary, setSummary] = useState<IndexSummary | null>(null);
  const [movers, setMovers] = useState<Movers | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const [sumRes, movRes] = await Promise.all([ngxApi.getSummary(), ngxApi.getMovers()]);
      setSummary(sumRes.data);
      setMovers(movRes.data);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) setForbidden(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && forbidden) {
    return (
      <>
        <Header title="NGX Module" subtitle="Nigerian Exchange Market Data" />
        <Card className="p-10 text-center space-y-4">
          <Lock className="w-12 h-12 text-accent-primary mx-auto" />
          <h2 className="text-xl font-bold">NGX Module — ClearFlow Pro</h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Access real-time NGX market data, top movers, sector indices, and the full NGX stock list with a Pro or Premium subscription.
          </p>
          <Link href="/subscription">
            <Button variant="primary">Upgrade to ClearFlow Pro</Button>
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <Header
        title="NGX Module"
        subtitle="Nigerian Exchange Group — Live Market Data"
        actions={
          <Button variant="secondary" onClick={load}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-background-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : summary && movers ? (
        <>
          {/* Market Overview */}
          <Card className="mb-5 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-text-muted mb-1">{summary.index.name}</div>
                <div className="text-4xl font-bold font-mono">{fmt(summary.index.value, 2)}</div>
                <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${(summary.index.changePct ?? 0) >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                  {(summary.index.changePct ?? 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {(summary.index.changePct ?? 0) >= 0 ? '+' : ''}{fmt(summary.index.change, 2)} ({(summary.index.changePct ?? 0) >= 0 ? '+' : ''}{fmt(summary.index.changePct)}%)
                  <span className="text-text-muted font-normal ml-2">YTD: +{fmt(summary.index.ytdChangePct)}%</span>
                </div>
              </div>
              <div className="text-right text-sm text-text-muted">As of 15:30 WAT</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background-tertiary rounded-xl">
                <div className="text-lg font-bold text-success">{summary.advancers}</div>
                <div className="text-xs text-text-muted">Advancers</div>
              </div>
              <div className="text-center p-3 bg-background-tertiary rounded-xl">
                <div className="text-lg font-bold text-accent-danger">{summary.decliners}</div>
                <div className="text-xs text-text-muted">Decliners</div>
              </div>
              <div className="text-center p-3 bg-background-tertiary rounded-xl">
                <div className="text-lg font-bold">₦{(summary.marketCapTrn ?? 0).toFixed(1)}T</div>
                <div className="text-xs text-text-muted">Market Cap</div>
              </div>
              <div className="text-center p-3 bg-background-tertiary rounded-xl">
                <div className="text-lg font-bold">₦{(summary.valueTradedBnNgn ?? 0).toFixed(1)}B</div>
                <div className="text-xs text-text-muted">Value Traded</div>
              </div>
            </div>
          </Card>

          {/* Sector Indices */}
          <Card className="mb-5">
            <CardHeader title="Sector Indices" actions={<BarChart2 className="w-4 h-4 text-text-muted" />} />
            <div className="divide-y divide-border">
              {(summary.sectorIndices ?? []).map((si) => (
                <div key={si.name} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-text-secondary">{si.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm">{fmt(si.value, 2)}</span>
                    <ChangeCell pct={si.changePct} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Movers */}
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            {/* Gainers */}
            <Card>
              <CardHeader title="Top Gainers" />
              <div className="divide-y divide-border">
                {(movers.topGainers ?? []).map((s) => (
                  <Link key={s.symbol} href={`/health-cards/${s.symbol}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-tertiary transition-colors">
                    <div>
                      <div className="font-mono text-sm font-semibold">{s.symbol}</div>
                      <div className="text-xs text-text-muted truncate max-w-[120px]">{s.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">₦{s.price.toLocaleString()}</div>
                      <ChangeCell pct={s.changePct} />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Losers */}
            <Card>
              <CardHeader title="Top Losers" />
              <div className="divide-y divide-border">
                {(movers.topLosers ?? []).map((s) => (
                  <Link key={s.symbol} href={`/health-cards/${s.symbol}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-tertiary transition-colors">
                    <div>
                      <div className="font-mono text-sm font-semibold">{s.symbol}</div>
                      <div className="text-xs text-text-muted truncate max-w-[120px]">{s.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">₦{s.price.toLocaleString()}</div>
                      <ChangeCell pct={s.changePct} />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Most Active */}
            <Card>
              <CardHeader title="Most Active" />
              <div className="divide-y divide-border">
                {(movers.mostActive ?? []).map((s) => (
                  <Link key={s.symbol} href={`/health-cards/${s.symbol}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-background-tertiary transition-colors">
                    <div>
                      <div className="font-mono text-sm font-semibold">{s.symbol}</div>
                      <div className="text-xs text-text-muted truncate max-w-[120px]">{s.name}</div>
                    </div>
                    <div className="text-right font-mono text-xs text-text-muted">
                      {(s.volume! / 1_000_000).toFixed(2)}M
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </>
  );
}
