'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { healthCardsApi } from '@/lib/api-client';
import { RefreshCw, TrendingUp, TrendingDown, Lock, ChevronRight, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CardSummary {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change_pct: number;
  health_score: number;
  rating: string;
  summary: string;
}

function HealthBar({ score }: { score: number }) {
  const colour = score >= 80 ? 'bg-success' : score >= 65 ? 'bg-warning' : 'bg-accent-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-background-tertiary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${score >= 80 ? 'text-success' : score >= 65 ? 'text-warning' : 'text-accent-danger'}`}>{score}</span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: string }) {
  const map: Record<string, string> = {
    'Strong Buy': 'text-success bg-success/10',
    'Buy': 'text-success bg-success/10',
    'Hold': 'text-warning bg-warning/10',
    'Sell': 'text-accent-danger bg-accent-danger/10',
    'Strong Sell': 'text-accent-danger bg-accent-danger/10',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[rating] ?? 'text-text-muted bg-background-tertiary'}`}>{rating}</span>;
}

export default function HealthCardsPage() {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [isLimited, setIsLimited] = useState(false);
  const [cardsRemaining, setCardsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const res = await healthCardsApi.list();
      setCards(res.data.cards || []);
      setIsLimited(res.data.isLimited);
      setCardsRemaining(res.data.cardsRemaining ?? null);
    } catch (err) {
      console.error('Failed to load health cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header
        title="Company Health Cards"
        subtitle="At-a-glance financial health for NGX-listed companies"
        actions={
          <Button variant="secondary" onClick={loadCards}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {isLimited && (
        <div className="mb-6 p-4 rounded-xl bg-accent-primary/5 border border-accent-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-accent-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {cardsRemaining !== null
                  ? `Free plan: ${cardsRemaining} detailed card${cardsRemaining !== 1 ? 's' : ''} remaining this session`
                  : 'Free plan: limited detailed card views'}
              </p>
              <p className="text-xs text-text-muted">Upgrade to ClearFlow Pro for unlimited detailed health cards with full financial metrics.</p>
            </div>
          </div>
          <Link href="/subscription">
            <Button variant="primary" className="text-xs whitespace-nowrap">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-background-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <Link key={card.symbol} href={`/health-cards/${card.symbol}`}>
              <Card className="p-5 h-full hover:border-accent-primary/30 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono font-bold text-base">{card.symbol}</div>
                    <div className="text-xs text-text-muted truncate max-w-[160px]">{card.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">₦{card.price.toLocaleString()}</div>
                    <div className={`text-xs flex items-center justify-end gap-0.5 ${card.change_pct >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                      {card.change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {card.change_pct >= 0 ? '+' : ''}{card.change_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Health Score</span>
                    <RatingBadge rating={card.rating} />
                  </div>
                  <HealthBar score={card.health_score} />
                </div>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{card.summary}</p>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-background-tertiary px-2 py-0.5 rounded-full text-text-muted">{card.sector}</span>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
