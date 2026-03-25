'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { analyticsApi } from '@/lib/api-client';
import { UpgradeGate } from '@/components/ui/upgrade-gate';
import { useSubscriptionStore, Features } from '@/stores/subscription-store';

const SECTOR_COLORS = ['#00ffaa', '#00d4ff', '#00ff88', '#ffbb00', '#ff6b9d', '#a855f7', '#f97316'];

export default function AnalyticsPage() {
  const { canAccess } = useSubscriptionStore();
  const [marketTrends, setMarketTrends] = useState<Record<string, unknown>[]>([]);
  const [sectorData, setSectorData] = useState<{ name: string; value: number; change: number; color: string }[]>([]);
  const [predictions, setPredictions] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [trendsRes, predictionsRes, sentimentRes] = await Promise.all([
          analyticsApi.getMarketTrends({ period: '1y' }).catch(() => ({ data: [] })),
          analyticsApi.getPredictions().catch(() => ({ data: [] })),
          analyticsApi.getSentiment().catch(() => ({ data: [] })),
        ]);

        const trends = Array.isArray(trendsRes.data) ? trendsRes.data : [];
        setMarketTrends(trends);

        const preds = Array.isArray(predictionsRes.data) ? predictionsRes.data : [];
        setPredictions(preds);

        const sectors = Array.isArray(sentimentRes.data) ? sentimentRes.data : [];
        const coloredSectors = sectors.map((s: Record<string, unknown>, i: number) => ({
          name: (s.name || s.sector || 'Unknown') as string,
          value: (s.value || s.percentage || 0) as number,
          change: (s.change || s.changePercent || 0) as number,
          color: SECTOR_COLORS[i % SECTOR_COLORS.length],
        }));
        setSectorData(coloredSectors);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (!canAccess(Features.BASIC_ANALYTICS)) {
    return (
      <>
        <Header title="Analytics" subtitle="Market trends and portfolio analytics" />
        <UpgradeGate
          requiredTier="pro"
          featureName="Analytics"
          description="Access market trends, sector analysis, and performance predictions with ClearFlow Pro."
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header title="Predictive Market Analytics" subtitle="AI-powered market insights and trend predictions" />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary text-sm">Loading analytics...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Predictive Market Analytics"
        subtitle="AI-powered market insights and trend predictions"
      />

      {/* Market Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          label="Market Trends"
          value={`${marketTrends.length}`}
          change="Data Points"
          changeType="positive"
          subtitle="Loaded from API"
          delay={0.1}
        />
        <StatCard
          label="Sectors Tracked"
          value={`${sectorData.length}`}
          change="Active"
          changeType="positive"
          subtitle="Sector analysis"
          delay={0.2}
        />
        <StatCard
          label="Predictions"
          value={`${predictions.length}`}
          change="AI Generated"
          changeType="positive"
          subtitle="Stock predictions"
          delay={0.3}
        />
        <StatCard
          label="Data Source"
          value="Live"
          change="Real-time"
          changeType="positive"
          subtitle="Market data"
          delay={0.4}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Portfolio vs Market */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader title="Portfolio vs. S&P 500" />
          <div className="h-64 md:h-80">
            {marketTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                No market trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketTrends}>
                  <defs>
                    <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ffaa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252d3f" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5a6478', fontSize: 12 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#5a6478', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#5a6478', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#141922', border: '1px solid #252d3f', borderRadius: '8px' }}
                    labelStyle={{ color: '#8b94a8' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="portfolio" stroke="#00ffaa" strokeWidth={2} fill="url(#colorPortfolio)" name="Portfolio" />
                  <Area yAxisId="right" type="monotone" dataKey="sp500" stroke="#00d4ff" strokeWidth={2} fillOpacity={0} name="S&P 500" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Sector Performance */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader title="Sector Performance" />
          <div className="h-64 md:h-80 flex items-center justify-center">
            {sectorData.length === 0 ? (
              <div className="text-text-muted text-sm">No sector data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#141922', border: '1px solid #252d3f', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {sectorData.length > 0 && (
            <div className="flex flex-wrap gap-2 md:gap-4 justify-center mt-4">
              {sectorData.map((sector) => (
                <div key={sector.name} className="flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                  <span className="text-[10px] md:text-xs text-text-secondary">{sector.name}</span>
                  <span className={`text-[10px] md:text-xs font-mono ${sector.change > 0 ? 'text-success' : 'text-accent-danger'}`}>
                    {sector.change > 0 ? '+' : ''}{sector.change}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Predictions */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader title="AI Price Predictions" />
        {predictions.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-text-muted text-sm">
            No predictions available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Symbol</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Company</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Direction</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Confidence</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Target Price</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, idx) => {
                  const direction = (pred.direction as string) || 'neutral';
                  const confidence = (pred.confidence as number) || 0;
                  const targetPrice = (pred.targetPrice as number) || 0;
                  return (
                    <tr key={(pred.symbol as string) || idx} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold">{pred.symbol as string}</span>
                      </td>
                      <td className="py-4 px-4 text-text-secondary">{(pred.name || pred.companyName || '') as string}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {direction === 'bullish' ? (
                            <TrendingUp className="w-4 h-4 text-success" />
                          ) : direction === 'bearish' ? (
                            <TrendingDown className="w-4 h-4 text-accent-danger" />
                          ) : (
                            <Activity className="w-4 h-4 text-warning" />
                          )}
                          <Badge
                            variant={
                              direction === 'bullish' ? 'positive' :
                              direction === 'bearish' ? 'negative' : 'neutral'
                            }
                          >
                            {direction}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-background-primary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary rounded-full"
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">{confidence}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-semibold">
                        {targetPrice > 0 ? `$${targetPrice.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
