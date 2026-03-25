'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { riskApi, portfolioApi } from '@/lib/api-client';
import { UpgradeGate } from '@/components/ui/upgrade-gate';
import type { RiskScore, VolatilityData } from '@/types';

const riskBreakdownColors: Record<string, string> = {
  diversification: '#00ffaa',
  concentration: '#00d4ff',
  positionSize: '#00ff88',
  volatility: '#ffbb00',
  correlation: '#ff6b9d',
};

interface RiskAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
}

interface StressTestResult {
  scenario: string;
  description: string;
  portfolioImpact: number;
  percentageChange: number;
  affectedAssets: { symbol: string; impact: number }[];
}

const SCENARIOS = [
  { value: 'recession', label: 'Recession — 20–30% market decline' },
  { value: 'market_crash', label: 'Market Crash — 40–50% decline (2008-style)' },
  { value: 'inflation', label: 'High Inflation — 10–15% decline' },
  { value: 'interest_rate_hike', label: 'Interest Rate Hike — 15–25% decline' },
];

export default function RiskManagementPage() {
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Stress test
  const [portfolioId, setPortfolioId] = useState('');
  const [showStressModal, setShowStressModal] = useState(false);
  const [scenario, setScenario] = useState('recession');
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [stressLoading, setStressLoading] = useState(false);
  const [stressError, setStressError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch portfolio ID for stress test
        const portfoliosRes = await portfolioApi.list();
        const portfolios = portfoliosRes.data || [];
        if (portfolios.length > 0) setPortfolioId(portfolios[0].id);

        const [scoreRes, volRes, alertsRes] = await Promise.all([
          riskApi.getScore(),
          riskApi.getVolatility(),
          riskApi.getAlerts(),
        ]);

        setRiskScore(scoreRes.data);
        setVolatilityData(Array.isArray(volRes.data) ? volRes.data : volRes.data.data ?? []);
        // Backend returns { alerts: [...], total: N }
        setRiskAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data.alerts ?? []);
      } catch (err: any) {
        if (err?.response?.status === 403) setForbidden(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunStressTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioId) {
      setStressError('No portfolio found. Add a portfolio first.');
      return;
    }
    setStressLoading(true);
    setStressError('');
    setStressResult(null);
    try {
      const res = await riskApi.runStressTest(portfolioId, scenario);
      setStressResult(res.data);
    } catch {
      setStressError('Failed to run stress test. Please try again.');
    } finally {
      setStressLoading(false);
    }
  };

  const overallRisk = riskScore?.overall ?? 0;

  const riskBreakdown = riskScore
    ? [
        { name: 'Diversification', score: riskScore.diversification, color: riskBreakdownColors.diversification },
        { name: 'Concentration', score: riskScore.concentration, color: riskBreakdownColors.concentration },
        { name: 'Position Size', score: riskScore.positionSize, color: riskBreakdownColors.positionSize },
        { name: 'Volatility', score: riskScore.volatility, color: riskBreakdownColors.volatility },
        { name: 'Correlation', score: riskScore.correlation, color: riskBreakdownColors.correlation },
      ]
    : [];

  const latestVol = volatilityData[volatilityData.length - 1];
  const prevVol = volatilityData[volatilityData.length - 2];
  const volChange = latestVol && prevVol
    ? ((latestVol.volatility - prevVol.volatility) / prevVol.volatility * 100).toFixed(1)
    : null;

  if (forbidden) {
    return (
      <>
        <Header title="Risk Management" subtitle="Analyse and manage your portfolio risk" />
        <UpgradeGate
          requiredTier="premium"
          featureName="Risk Management"
          description="Access risk scores, volatility analysis, and stress testing with ClearFlow Premium."
        />
      </>
    );
  }

  return (
    <>
      <Header
        title="Risk Management"
        subtitle="Monitor and manage your portfolio risk exposure"
        actions={
          <Button variant="primary" onClick={() => { setShowStressModal(true); setStressResult(null); setStressError(''); }}>
            <Activity className="w-4 h-4" />
            Run Stress Test
          </Button>
        }
      />

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          label="Overall Risk Score"
          value={loading ? '—' : `${overallRisk}/10`}
          change={riskScore?.recommendation ?? 'Moderate'}
          changeType="neutral"
          subtitle="Within tolerance"
          delay={0.1}
        />
        <StatCard
          label="Portfolio Volatility"
          value={loading ? '—' : latestVol ? `${(latestVol.volatility * 100).toFixed(1)}%` : 'N/A'}
          change={volChange ? `${Number(volChange) >= 0 ? '+' : ''}${volChange}%` : '—'}
          changeType={volChange && Number(volChange) < 0 ? 'positive' : 'negative'}
          subtitle="vs. previous period"
          delay={0.2}
        />
        <StatCard
          label="Benchmark Volatility"
          value={loading ? '—' : latestVol ? `${(latestVol.benchmark * 100).toFixed(1)}%` : 'N/A'}
          change="Latest"
          changeType="neutral"
          subtitle="Market comparison"
          delay={0.3}
        />
        <StatCard
          label="Active Alerts"
          value={loading ? '—' : String(riskAlerts.length)}
          change={riskAlerts.length === 0 ? 'Clear' : 'Review'}
          changeType={riskAlerts.length === 0 ? 'positive' : 'negative'}
          subtitle="Risk notifications"
          delay={0.4}
        />
      </div>

      {/* Risk Meter and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Risk Meter */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader title="Risk Score Breakdown" />
          {loading ? (
            <div className="text-sm text-text-muted text-center py-10">Loading risk data...</div>
          ) : !riskScore ? (
            <div className="text-sm text-text-muted text-center py-10">No risk data available</div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <div className="relative w-36 h-36 md:w-48 md:h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[{ value: overallRisk }, { value: 10 - overallRisk }]}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        <Cell fill="#ffbb00" />
                        <Cell fill="#252d3f" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl md:text-4xl font-bold">{overallRisk}</div>
                    <div className="text-xs md:text-sm text-text-muted">/ 10</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                {riskBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 md:gap-4">
                    <div className="w-24 md:w-32 text-xs md:text-sm text-text-secondary truncate">{item.name}</div>
                    <div className="flex-1 h-1.5 md:h-2 bg-background-primary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.score * 10}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <div className="w-8 md:w-12 text-right font-mono text-xs md:text-sm">{item.score.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Volatility Chart */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader title="Volatility Trend" />
          {loading ? (
            <div className="text-sm text-text-muted text-center py-10">Loading volatility data...</div>
          ) : volatilityData.length === 0 ? (
            <div className="text-sm text-text-muted text-center py-10">No volatility data available</div>
          ) : (
            <>
              <div className="h-56 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={volatilityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252d3f" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#5a6478', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5a6478', fontSize: 12 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      contentStyle={{ background: '#141922', border: '1px solid #252d3f', borderRadius: '8px' }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`]}
                    />
                    <Line type="monotone" dataKey="volatility" stroke="#00ffaa" strokeWidth={2} dot={false} name="Portfolio" />
                    <Line type="monotone" dataKey="benchmark" stroke="#00d4ff" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Benchmark" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-6 justify-center pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-accent-primary" />
                  <span className="text-sm text-text-secondary">Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-accent-secondary" />
                  <span className="text-sm text-text-secondary">Benchmark</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Risk Alerts */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader title="Active Risk Alerts" />
        {loading ? (
          <div className="text-sm text-text-muted text-center py-6">Loading alerts...</div>
        ) : riskAlerts.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-6">No active risk alerts</div>
        ) : (
          <div className="space-y-4">
            {riskAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 bg-background-tertiary rounded-xl border-l-4 ${
                  alert.severity === 'warning'
                    ? 'border-warning'
                    : alert.severity === 'info'
                    ? 'border-accent-secondary'
                    : 'border-text-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${
                      alert.severity === 'warning'
                        ? 'text-warning'
                        : alert.severity === 'info'
                        ? 'text-accent-secondary'
                        : 'text-text-muted'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{alert.title}</h4>
                    <p className="text-sm text-text-secondary">{alert.description}</p>
                  </div>
                  <Badge variant={alert.severity === 'warning' ? 'warning' : 'neutral'}>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stress Test Modal */}
      {showStressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowStressModal(false)} />
          <div className="relative bg-background-secondary border border-border rounded-card shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">Portfolio Stress Test</h2>
                <p className="text-sm text-text-secondary mt-0.5">Simulate how your portfolio performs under market stress</p>
              </div>
              <button onClick={() => setShowStressModal(false)} className="p-2 hover:bg-background-tertiary rounded-lg transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="p-6">
              {!stressResult ? (
                <form onSubmit={handleRunStressTest} className="space-y-4">
                  {stressError && (
                    <div className="p-3 rounded-lg bg-accent-danger/10 border border-accent-danger/30 text-accent-danger text-sm">
                      {stressError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Select Scenario</label>
                    <div className="space-y-2">
                      {SCENARIOS.map((s) => (
                        <label key={s.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${scenario === s.value ? 'border-accent-primary bg-accent-primary/5' : 'border-border hover:border-border/80'}`}>
                          <input
                            type="radio"
                            name="scenario"
                            value={s.value}
                            checked={scenario === s.value}
                            onChange={() => setScenario(s.value)}
                            className="accent-accent-primary"
                          />
                          <span className="text-sm">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowStressModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1" isLoading={stressLoading}>
                      Run Test
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  {/* Result summary */}
                  <div className={`p-4 rounded-xl border ${stressResult.percentageChange < 0 ? 'bg-accent-danger/10 border-accent-danger/30' : 'bg-success/10 border-success/30'}`}>
                    <div className="text-sm text-text-secondary mb-1">{stressResult.description}</div>
                    <div className="flex items-end gap-3">
                      <div>
                        <div className="text-xs text-text-muted mb-0.5">Portfolio Impact</div>
                        <div className={`text-2xl font-bold ${stressResult.portfolioImpact < 0 ? 'text-accent-danger' : 'text-success'}`}>
                          {stressResult.portfolioImpact < 0 ? '' : '+'}{stressResult.portfolioImpact.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-0.5">Change</div>
                        <div className={`text-2xl font-bold ${stressResult.percentageChange < 0 ? 'text-accent-danger' : 'text-success'}`}>
                          {stressResult.percentageChange >= 0 ? '+' : ''}{stressResult.percentageChange.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Affected assets */}
                  {stressResult.affectedAssets.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-text-secondary mb-2">Affected Positions</div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {stressResult.affectedAssets
                          .sort((a, b) => a.impact - b.impact)
                          .map((asset) => (
                            <div key={asset.symbol} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background-tertiary">
                              <span className="font-mono font-semibold text-sm">{asset.symbol}</span>
                              <span className={`font-mono text-sm ${asset.impact < 0 ? 'text-accent-danger' : 'text-success'}`}>
                                {asset.impact >= 0 ? '+' : ''}{asset.impact.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setStressResult(null)}>
                      Run Another
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={() => setShowStressModal(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
