'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { newsApi } from '@/lib/api-client';
import { RefreshCw, Clock, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['all', 'market', 'economy', 'company', 'earnings', 'policy'];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  market: 'Market',
  economy: 'Economy',
  company: 'Company',
  earnings: 'Earnings',
  policy: 'Policy',
};

interface Article {
  id: string;
  title: string;
  source: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  summary: string;
  related_symbols: string[];
  published_at: string;
  read_time: number;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-medium">
        <TrendingUp className="w-3 h-3" /> Positive
      </span>
    );
  }
  if (sentiment === 'negative') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent-danger bg-accent-danger/10 px-2 py-0.5 rounded-full font-medium">
        <TrendingDown className="w-3 h-3" /> Negative
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-background-tertiary px-2 py-0.5 rounded-full font-medium">
      <Minus className="w-3 h-3" /> Neutral
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState('all');
  const [isLimited, setIsLimited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, [category]);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const params = category !== 'all' ? { category } : {};
      const res = await newsApi.list(params);
      setArticles(res.data.articles || []);
      setIsLimited(res.data.isLimited);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header
        title="News Intelligence Feed"
        subtitle="Financial news with AI sentiment analysis"
        actions={
          <Button variant="secondary" onClick={loadNews}>
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
              <p className="text-sm font-medium">Showing 5 of 15+ articles</p>
              <p className="text-xs text-text-muted">Upgrade to ClearFlow Pro for unlimited news, all categories & symbol filters.</p>
            </div>
          </div>
          <Link href="/subscription">
            <Button variant="primary" className="text-xs whitespace-nowrap">Upgrade to Pro</Button>
          </Link>
        </div>
      )}

      {/* Category Filters */}
      <Card className="mb-6 p-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                category === c
                  ? 'bg-accent-primary text-background-primary'
                  : 'bg-background-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </Card>

      {/* Articles */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-background-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="p-5 hover:border-accent-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                    <SentimentBadge sentiment={article.sentiment} />
                    <span className="text-xs text-text-muted">{article.source}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 leading-snug">{article.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{article.summary}</p>
                  {article.related_symbols.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {article.related_symbols.map((sym) => (
                        <span key={sym} className="text-xs font-mono bg-background-tertiary px-2 py-0.5 rounded text-text-muted">
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-text-muted flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {timeAgo(article.published_at)}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{article.read_time} min read</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
