'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { portfolioApi } from '@/lib/api-client';

interface PerformanceChartProps {
  portfolioId?: string;
}

const periods = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
const periodMap: Record<string, string> = { '1M': '1m', '3M': '3m', '6M': '6m', '1Y': '1y', 'ALL': 'max' };

export function PerformanceChart({ portfolioId }: PerformanceChartProps) {
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<string>('1Y');

  useEffect(() => {
    if (!portfolioId) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await portfolioApi.getPerformance(portfolioId, periodMap[activePeriod]);
        const data = Array.isArray(res.data) ? res.data : [];
        setChartData(data);
      } catch {
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [portfolioId, activePeriod]);

  const startValue = chartData.length > 0 ? chartData[0].value : 0;
  const endValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const totalGain = endValue - startValue;

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      <CardHeader
        title="Performance Overview"
        actions={
          <div className="flex gap-1 md:gap-2">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`icon-btn text-xs font-medium px-2 md:px-3 ${
                  activePeriod === p ? 'bg-accent-primary/20 text-accent-primary border-accent-primary' : ''
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />
      <div className="h-48 sm:h-64 md:h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-muted text-sm">
            No performance data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ffaa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252d3f" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5a6478', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5a6478', fontSize: 10 }}
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: '#141922',
                  border: '1px solid #252d3f',
                  borderRadius: '8px',
                  color: '#e8edf4',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                labelStyle={{ color: '#8b94a8' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00ffaa"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {chartData.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-4 border-t border-border">
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1">Starting Value</div>
            <div className="text-lg md:text-xl font-semibold font-mono">{formatCurrency(startValue)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1">Current Value</div>
            <div className="text-lg md:text-xl font-semibold font-mono">{formatCurrency(endValue)}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-muted mb-1">Total Gain</div>
            <div className={`text-lg md:text-xl font-semibold font-mono ${totalGain >= 0 ? 'text-success' : 'text-accent-danger'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
