'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Target, TrendingUp, DollarSign, Zap, Sparkles } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { recommendationApi } from '@/lib/api-client';
import type { Recommendation } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  rebalance: Target,
  buy: TrendingUp,
  sell: TrendingUp,
  opportunity: TrendingUp,
  tax_harvest: DollarSign,
  risk_alert: Zap,
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recommendationApi.list({ limit: 4 });
      const data = res.data;
      setInsights(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInsights = async () => {
    setGenerating(true);
    try {
      await recommendationApi.generate();
      await fetchInsights();
    } catch {
      // generation may not be available — just refresh
      await fetchInsights();
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
      <CardHeader
        title="AI Insights"
        actions={
          <button className="icon-btn" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <div className="flex flex-col gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-background-tertiary rounded-xl animate-pulse" />
            ))}
          </>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">No insights yet</div>
              <div className="text-xs text-text-muted">Generate AI-powered recommendations based on your portfolio</div>
            </div>
            <button
              onClick={generateInsights}
              disabled={generating}
              className="btn btn-primary text-xs px-4 py-2 mt-1"
            >
              {generating ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Generate Insights</>
              )}
            </button>
          </div>
        ) : (
          insights.map((insight) => {
            const Icon = iconMap[insight.type] ?? Target;
            return (
              <div key={insight.id} className="insight-item">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-background-primary" />
                  </div>
                  <div className="text-sm font-semibold flex-1">{insight.title}</div>
                  <div className="text-[11px] text-text-muted font-mono">
                    {formatTimeAgo(insight.createdAt)}
                  </div>
                </div>
                <div className="text-[13px] text-text-secondary leading-relaxed">
                  {insight.description}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
