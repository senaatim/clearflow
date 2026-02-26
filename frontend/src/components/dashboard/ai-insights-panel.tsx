'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Target, TrendingUp, DollarSign, Zap } from 'lucide-react';
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

  if (diffMin < 60) return `${diffMin}m ago`;
  return `${diffHour}h ago`;
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recommendationApi.list({ limit: 4 });
      const data = res.data;
      setInsights(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
      <CardHeader
        title="AI Insights"
        actions={
          <button className="icon-btn" onClick={fetchInsights}>
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-sm text-text-muted text-center py-6">Loading insights...</div>
        ) : insights.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-6">No insights available</div>
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
