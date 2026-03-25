'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingDown, Calendar, ArrowRight } from 'lucide-react';
import { Header, Button } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency } from '@/lib/utils';
import { taxApi } from '@/lib/api-client';
import { UpgradeGate } from '@/components/ui/upgrade-gate';
import type { TaxSummary, TaxHarvestingOpportunity } from '@/types';

interface GainLossEvent {
  date: string;
  symbol: string;
  type: string;
  gainLoss: number;
  term: string;
}

export default function TaxOptimizationPage() {
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [harvestingOpportunities, setHarvestingOpportunities] = useState<TaxHarvestingOpportunity[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<GainLossEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summaryRes, harvestRes, gainsRes] = await Promise.all([
          taxApi.getSummary(),
          taxApi.getHarvestingOpportunities(),
          taxApi.getGainsLosses(),
        ]);
        setTaxSummary(summaryRes.data);
        const harvest = harvestRes.data;
        setHarvestingOpportunities(Array.isArray(harvest) ? harvest : harvest.data ?? []);
        const gains = gainsRes.data;
        setRecentTransactions(Array.isArray(gains) ? gains : gains.data ?? []);
      } catch (err: any) {
        if (err?.response?.status === 403) setForbidden(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPotentialSavings = harvestingOpportunities.reduce(
    (sum, o) => sum + o.potentialTaxSavings,
    0
  );

  if (forbidden) {
    return (
      <>
        <Header title="Tax Optimization" subtitle="Maximize your after-tax returns with smart tax strategies" />
        <UpgradeGate
          requiredTier="premium"
          featureName="Tax Optimization"
          description="Unlock tax-loss harvesting, gain/loss tracking, and smart tax strategies with ClearFlow Premium."
        />
      </>
    );
  }

  return (
    <>
      <Header
        title="Tax Optimization"
        subtitle="Maximize your after-tax returns with smart tax strategies"
        actions={
          <Button variant="primary">
            <Calculator className="w-4 h-4" />
            Calculate Impact
          </Button>
        }
      />

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard
          label="Estimated Tax Liability"
          value={loading ? '—' : taxSummary ? formatCurrency(taxSummary.estimatedTaxLiability) : 'N/A'}
          change={taxSummary ? String(taxSummary.year) : '—'}
          changeType="neutral"
          subtitle="Based on realized gains"
          delay={0.1}
        />
        <StatCard
          label="Net Realized Gains"
          value={loading ? '—' : taxSummary ? formatCurrency(taxSummary.netGainLoss) : 'N/A'}
          change={taxSummary ? `+${formatCurrency(taxSummary.totalRealizedGains)}` : '—'}
          changeType="positive"
          subtitle="YTD total"
          delay={0.2}
        />
        <StatCard
          label="Tax-Loss Harvesting"
          value={loading ? '—' : formatCurrency(totalPotentialSavings)}
          change="Available"
          changeType="positive"
          subtitle="Potential savings"
          delay={0.3}
        />
        <StatCard
          label="Long-Term Gains"
          value={loading ? '—' : taxSummary ? formatCurrency(taxSummary.longTermGains) : 'N/A'}
          change="15% rate"
          changeType="positive"
          subtitle="Lower tax rate"
          delay={0.4}
        />
      </div>

      {/* Tax Breakdown and Harvesting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Tax Breakdown */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader title={taxSummary ? `${taxSummary.year} Tax Summary` : 'Tax Summary'} />
          {loading ? (
            <div className="text-sm text-text-muted text-center py-10">Loading tax data...</div>
          ) : !taxSummary ? (
            <div className="text-sm text-text-muted text-center py-10">No tax data available</div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-background-tertiary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-success transform rotate-180" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-text-muted">Short-Term Gains</div>
                    <div className="font-semibold text-sm md:text-base">Taxed at ordinary income rate</div>
                  </div>
                </div>
                <div className="text-left sm:text-right ml-11 sm:ml-0">
                  <div className="text-lg md:text-xl font-bold font-mono">{formatCurrency(taxSummary.shortTermGains)}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-background-tertiary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-accent-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-text-muted">Long-Term Gains</div>
                    <div className="font-semibold text-sm md:text-base">Taxed at 15%</div>
                  </div>
                </div>
                <div className="text-left sm:text-right ml-11 sm:ml-0">
                  <div className="text-lg md:text-xl font-bold font-mono">{formatCurrency(taxSummary.longTermGains)}</div>
                  <div className="text-xs md:text-sm text-text-muted">Tax: {formatCurrency(taxSummary.longTermGains * 0.15)}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-background-tertiary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-danger/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-accent-danger" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs md:text-sm text-text-muted">Realized Losses</div>
                    <div className="font-semibold text-sm md:text-base">Offsets capital gains</div>
                  </div>
                </div>
                <div className="text-left sm:text-right ml-11 sm:ml-0">
                  <div className="text-lg md:text-xl font-bold font-mono text-accent-danger">
                    {formatCurrency(taxSummary.totalRealizedLosses)}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-base md:text-lg font-semibold">Estimated Tax Liability</span>
                  <span className="text-xl md:text-2xl font-bold font-mono">{formatCurrency(taxSummary.estimatedTaxLiability)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Tax-Loss Harvesting */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader title="Tax-Loss Harvesting Opportunities" />
          {loading ? (
            <div className="text-sm text-text-muted text-center py-10">Loading opportunities...</div>
          ) : harvestingOpportunities.length === 0 ? (
            <div className="text-sm text-text-muted text-center py-10">No harvesting opportunities found</div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {harvestingOpportunities.map((opp) => (
                <div key={opp.assetId} className="p-3 md:p-4 bg-background-tertiary rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-semibold">{opp.symbol}</span>
                        {opp.washSaleRisk && (
                          <Badge variant="warning">Wash Sale Risk</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-xs md:text-sm text-text-muted">Potential Savings</div>
                      <div className="text-base md:text-lg font-bold text-success font-mono">
                        {formatCurrency(opp.potentialTaxSavings)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm">
                    <div>
                      <span className="text-text-muted">Loss: </span>
                      <span className="font-mono text-accent-danger">-{formatCurrency(opp.unrealizedLoss)}</span>
                    </div>
                    {opp.suggestedReplacement && (
                      <div className="flex items-center gap-1">
                        <span className="text-text-muted">Replace:</span>
                        <span className="font-mono text-accent-primary">{opp.suggestedReplacement}</span>
                      </div>
                    )}
                  </div>
                  <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium">
                    Harvest Loss
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Taxable Events */}
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader title="Recent Taxable Events" />
        {loading ? (
          <div className="text-sm text-text-muted text-center py-6">Loading transactions...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-6">No taxable events recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Symbol</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Type</th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-text-muted">Term</th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-text-muted">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-background-tertiary transition-colors">
                    <td className="py-4 px-4 font-mono text-sm">{tx.date}</td>
                    <td className="py-4 px-4 font-mono font-semibold">{tx.symbol}</td>
                    <td className="py-4 px-4">
                      <Badge variant={tx.type === 'sell' ? 'neutral' : 'positive'}>
                        {tx.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={tx.term === 'Long' ? 'positive' : 'warning'}>
                        {tx.term}-Term
                      </Badge>
                    </td>
                    <td className={`py-4 px-4 text-right font-mono font-semibold ${tx.gainLoss >= 0 ? 'text-success' : 'text-accent-danger'}`}>
                      {tx.gainLoss >= 0 ? '+' : ''}{formatCurrency(tx.gainLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
