'use client';

import { useState, useEffect } from 'react';
import { Upload, Plus, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { transactionApi } from '@/lib/api-client';
import type { ActivityItem } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  dividend: Plus,
  rebalance: TrendingUp,
  contribution: DollarSign,
  milestone: CheckCircle,
  buy: Plus,
  sell: Upload,
  deposit: DollarSign,
  withdrawal: Upload,
};

interface ActivityFeedProps {
  portfolioId?: string;
}

export function ActivityFeed({ portfolioId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!portfolioId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await transactionApi.list(portfolioId, { limit: 10 });
        const transactions = Array.isArray(res.data) ? res.data : [];
        const mapped: ActivityItem[] = transactions.map((tx: Record<string, unknown>) => ({
          id: tx.id as string,
          type: (tx.type as string) || 'buy',
          title: `${String(tx.type || 'Transaction').charAt(0).toUpperCase() + String(tx.type || 'transaction').slice(1)}${tx.symbol ? ` - ${tx.symbol}` : ''}`,
          description: (tx.notes as string) || `${tx.type} transaction`,
          amount: tx.totalAmount as number | undefined,
          timestamp: (tx.executedAt || tx.createdAt) as string,
        }));
        setActivities(mapped);
      } catch {
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [portfolioId]);

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
      <CardHeader
        title="Recent Activity"
        actions={
          <button className="icon-btn">
            <Upload className="w-4 h-4 text-text-secondary" />
          </button>
        }
      />
      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-text-muted text-sm">
          No recent activity
        </div>
      ) : (
        <div className="activity-feed">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type] || Plus;
            return (
              <div key={activity.id} className="activity-item">
                <div className="w-10 h-10 rounded-[10px] bg-background-tertiary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">{activity.title}</div>
                  <div className="text-[13px] text-text-secondary mb-2">
                    {activity.description}
                  </div>
                  <div className="text-[11px] text-text-muted font-mono">
                    {formatRelativeTime(activity.timestamp)}
                  </div>
                </div>
                <div className="text-right font-mono">
                  {activity.amount ? (
                    <div className="text-base font-semibold text-success">
                      +{formatCurrency(activity.amount)}
                    </div>
                  ) : (
                    <div className="text-base text-text-muted">-</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
