'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { healthCardsApi } from '@/lib/api-client';
import { TrendingUp, TrendingDown, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface HealthCard {
  symbol: string; name: string; sector: string;
  price: number; changePct: number; healthScore: number;
  rating: string; analystCount: number;
  revenueBn: number; revenueGrowth: number;
  profitMargin: number; ebitdaMargin: number;
  peRatio: number; pbRatio: number; psRatio: number;
  debtToEquity: number; currentRatio: number; quickRatio: number;
  roe: number; roa: number; roce: number;
  eps: number; epsGrowth: number;
  dividendYield: number; payoutRatio: number;
  marketCapBn: number;
  '52wHigh': number; '52wLow': number;
  strengths: string[]; risks: string[];
  summary: string;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-3 bg-background-tertiary rounded-xl">
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const colour = score >= 80 ? 'bg-success' : score >= 65 ? 'bg-warning' : 'bg-accent-danger';
  const label = score >= 80 ? 'text-success' : score >= 65 ? 'text-warning' : 'text-accent-danger';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-bold text-lg ${label}`}>{score}/100</span>
    </div>
  );
}

export default function HealthCardDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const router = useRouter();
  const [card, setCard] = useState<HealthCard | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    healthCardsApi.get(symbol as string)
      .then((res) => setCard(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? 'Failed to load health card';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [symbol]);

  if (isLoading) {
    return (
      <>
        <Header title="Company Health Card" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-background-secondary rounded-xl animate-pulse" />)}
        </div>
      </>
    );
  }

  if (error || !card) {
    return (
      <>
        <Header title="Company Health Card" />
        <Card className="p-8 text-center space-y-4">
          <p className="text-accent-danger">{error || 'Card not found'}</p>
          {error?.includes('limit') && (
            <Link href="/subscription">
              <Button variant="primary">Upgrade to ClearFlow Pro</Button>
            </Link>
          )}
          <Link href="/health-cards">
            <Button variant="secondary"><ArrowLeft className="w-4 h-4" /> Back to Health Cards</Button>
          </Link>
        </Card>
      </>
    );
  }

  const priceRange52w = (card['52wHigh'] ?? 0) - (card['52wLow'] ?? 0);
  const pricePct52w = priceRange52w > 0 ? ((card.price - (card['52wLow'] ?? 0)) / priceRange52w) * 100 : 50;

  return (
    <>
      <Header
        title={`${card.symbol} — ${card.name}`}
        subtitle={card.sector}
        actions={
          <Link href="/health-cards">
            <Button variant="secondary"><ArrowLeft className="w-4 h-4" /> All Cards</Button>
          </Link>
        }
      />

      {/* Price + Health Overview */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-3xl font-bold font-mono">₦{card.price.toLocaleString()}</div>
              <div className={`flex items-center gap-1 mt-1 ${(card.changePct ?? 0) >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                {(card.changePct ?? 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">{(card.changePct ?? 0) >= 0 ? '+' : ''}{(card.changePct ?? 0).toFixed(1)}% today</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                card.rating.includes('Strong Buy') ? 'text-success bg-success/10' :
                card.rating === 'Buy' ? 'text-success bg-success/10' :
                card.rating === 'Hold' ? 'text-warning bg-warning/10' :
                'text-accent-danger bg-accent-danger/10'
              }`}>{card.rating}</span>
              <div className="text-xs text-text-muted mt-1">{card.analystCount} analysts</div>
            </div>
          </div>

          {/* 52-week range */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>52W Low: ₦{(card['52wLow'] ?? 0).toLocaleString()}</span>
              <span>52W High: ₦{(card['52wHigh'] ?? 0).toLocaleString()}</span>
            </div>
            <div className="relative h-1.5 bg-background-tertiary rounded-full">
              <div className="absolute h-1.5 rounded-full bg-gradient-to-r from-accent-danger via-warning to-success" style={{ width: '100%' }} />
              <div
                className="absolute w-3 h-3 bg-white border-2 border-accent-primary rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${pricePct52w}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">{card.summary}</p>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-medium mb-3">Health Score</div>
          <HealthBar score={card.healthScore ?? 0} />
          <div className="mt-4 space-y-2 text-xs text-text-muted">
            <div className="flex justify-between"><span>Market Cap</span><span className="font-mono text-text-primary">₦{(card.marketCapBn ?? 0).toLocaleString()}B</span></div>
            <div className="flex justify-between"><span>Revenue</span><span className="font-mono text-text-primary">₦{(card.revenueBn ?? 0).toFixed(1)}B</span></div>
            <div className="flex justify-between"><span>Revenue Growth</span><span className="font-mono text-success">+{card.revenueGrowth ?? 0}%</span></div>
            <div className="flex justify-between"><span>Dividend Yield</span><span className="font-mono text-text-primary">{card.dividendYield ?? 0}%</span></div>
          </div>
        </Card>
      </div>

      {/* Valuation */}
      <Card className="mb-5">
        <CardHeader title="Valuation" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 pt-0">
          <Metric label="P/E Ratio" value={`${card.peRatio ?? '—'}x`} />
          <Metric label="P/B Ratio" value={`${card.pbRatio ?? '—'}x`} />
          <Metric label="P/S Ratio" value={`${card.psRatio ?? '—'}x`} />
          <Metric label="EPS" value={`₦${(card.eps ?? 0).toFixed(2)}`} sub={`+${card.epsGrowth ?? 0}% growth`} />
          <Metric label="Dividend Yield" value={`${card.dividendYield ?? 0}%`} sub={`${card.payoutRatio ?? 0}% payout`} />
          <Metric label="Market Cap" value={`₦${(card.marketCapBn ?? 0).toLocaleString()}B`} />
        </div>
      </Card>

      {/* Profitability */}
      <Card className="mb-5">
        <CardHeader title="Profitability" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-4 pt-0">
          <Metric label="Profit Margin" value={`${card.profitMargin ?? 0}%`} />
          <Metric label="EBITDA Margin" value={`${card.ebitdaMargin ?? 0}%`} />
          <Metric label="ROE" value={`${card.roe ?? 0}%`} />
          <Metric label="ROA" value={`${card.roa ?? 0}%`} />
          <Metric label="ROCE" value={`${card.roce ?? 0}%`} />
          <Metric label="Revenue" value={`₦${(card.revenueBn ?? 0).toFixed(1)}B`} sub={`+${card.revenueGrowth ?? 0}% YoY`} />
        </div>
      </Card>

      {/* Financial Health */}
      <Card className="mb-5">
        <CardHeader title="Financial Health" />
        <div className="grid grid-cols-3 gap-3 p-4 pt-0">
          <Metric label="Debt / Equity" value={`${card.debtToEquity ?? 0}x`} sub={(card.debtToEquity ?? 0) < 1 ? 'Low leverage' : (card.debtToEquity ?? 0) < 2 ? 'Moderate' : 'High leverage'} />
          <Metric label="Current Ratio" value={`${card.currentRatio ?? 0}x`} sub={(card.currentRatio ?? 0) >= 1.5 ? 'Healthy' : 'Monitor closely'} />
          <Metric label="Quick Ratio" value={`${card.quickRatio ?? 0}x`} />
        </div>
      </Card>

      {/* Strengths & Risks */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card className="p-5">
          <div className="text-sm font-semibold mb-3 text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Key Strengths
          </div>
          <ul className="space-y-2">
            {card.strengths.map((s, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-success mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-3 text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Key Risks
          </div>
          <ul className="space-y-2">
            {card.risks.map((r, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
