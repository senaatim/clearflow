'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Plus, Settings, TrendingUp, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { Header, Button } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { automationApi, tradeApi } from '@/lib/api-client';
import type { AutomationRule, TradeRequest } from '@/types';

const ruleIconMap: Record<string, React.ElementType> = {
  rebalance: TrendingUp,
  contribution: DollarSign,
  alert: AlertTriangle,
};

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rulesRes, tradesRes] = await Promise.all([
          automationApi.listRules(),
          tradeApi.list({ limit: 5 }),
        ]);
        const rulesData = rulesRes.data;
        const tradesData = tradesRes.data;
        setRules(Array.isArray(rulesData) ? rulesData : rulesData.data ?? []);
        setRecentTrades(Array.isArray(tradesData) ? tradesData : tradesData.data ?? []);
      } catch {
        // silently fail — empty state shown below
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRule = async (id: string, currentActive: boolean) => {
    try {
      await automationApi.toggleRule(id, !currentActive);
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === id ? { ...rule, isActive: !currentActive } : rule
        )
      );
    } catch {
      // silently fail
    }
  };

  const activeRules = rules.filter((r) => r.isActive).length;
  const now = new Date();
  const thisMonthTrades = recentTrades.filter((t) => {
    const created = new Date(t.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  });

  return (
    <>
      <Header
        title="Robo-Advisor Automation"
        subtitle="Set up automated investment rules and strategies"
        actions={
          <Button variant="primary">
            <Plus className="w-4 h-4" />
            Create Rule
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Active Rules"
          value={loading ? '—' : `${activeRules}/${rules.length}`}
          change="Running"
          changeType="positive"
          subtitle="Automation enabled"
          delay={0.1}
        />
        <StatCard
          label="Actions This Month"
          value={loading ? '—' : String(thisMonthTrades.length)}
          change="Trades"
          changeType="positive"
          subtitle="Current month"
          delay={0.2}
        />
        <StatCard
          label="Pending Trades"
          value={loading ? '—' : String(recentTrades.filter((t) => t.status === 'pending').length)}
          change="Awaiting"
          changeType="neutral"
          subtitle="Broker execution"
          delay={0.3}
        />
        <StatCard
          label="Executed Trades"
          value={loading ? '—' : String(recentTrades.filter((t) => t.status === 'executed').length)}
          change="Completed"
          changeType="positive"
          subtitle="Successfully filled"
          delay={0.4}
        />
      </div>

      {/* Automation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader
            title="Automation Rules"
            actions={
              <button className="icon-btn">
                <Settings className="w-4 h-4 text-text-secondary" />
              </button>
            }
          />
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-text-muted text-center py-6">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-6">No automation rules yet</div>
            ) : (
              rules.map((rule) => {
                const Icon = ruleIconMap[rule.type] ?? TrendingUp;
                return (
                  <div
                    key={rule.id}
                    className={`p-4 bg-background-tertiary rounded-xl border-l-4 ${
                      rule.isActive ? 'border-accent-primary' : 'border-text-muted'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          rule.isActive
                            ? 'bg-accent-primary/20 text-accent-primary'
                            : 'bg-background-secondary text-text-muted'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.isActive ? 'positive' : 'neutral'}>
                            {rule.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary mb-2 capitalize">{rule.type}</p>
                        {rule.lastTriggered && (
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleRule(rule.id, rule.isActive)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          rule.isActive
                            ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                            : 'bg-background-secondary text-text-muted hover:bg-background-primary'
                        }`}
                      >
                        {rule.isActive ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent Automated Actions */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader title="Recent Trade Requests" />
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-text-muted text-center py-6">Loading trades...</div>
            ) : recentTrades.length === 0 ? (
              <div className="text-sm text-text-muted text-center py-6">No recent trades</div>
            ) : (
              recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-4 bg-background-tertiary rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold font-mono">{trade.symbol}</span>
                        <Badge
                          variant={
                            trade.status === 'executed'
                              ? 'positive'
                              : trade.status === 'rejected' || trade.status === 'canceled'
                              ? 'negative'
                              : 'warning'
                          }
                        >
                          {trade.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary capitalize">
                        {trade.action} · {trade.quantity} shares
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted font-mono">
                    {new Date(trade.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Settings */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader title="Quick Settings" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-background-tertiary rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Auto-Rebalancing</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-background-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>
            <p className="text-sm text-text-secondary">
              Automatically rebalance portfolio when allocations drift from targets
            </p>
          </div>

          <div className="p-4 bg-background-tertiary rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Dividend Reinvestment</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-background-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>
            <p className="text-sm text-text-secondary">
              Reinvest dividends automatically into the same holdings
            </p>
          </div>

          <div className="p-4 bg-background-tertiary rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Tax-Loss Alerts</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-background-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
              </label>
            </div>
            <p className="text-sm text-text-secondary">
              Get notified of tax-loss harvesting opportunities
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
