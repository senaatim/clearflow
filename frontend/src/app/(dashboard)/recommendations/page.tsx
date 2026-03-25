'use client';

import { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, DollarSign, AlertTriangle, Check, X, Briefcase } from 'lucide-react';
import { Header, Button } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrokerExecutionModal } from '@/components/dashboard/broker-execution-modal';
import { InvestmentDisclaimer } from '@/components/ui/disclaimer';
import { useSubscriptionStore, Features } from '@/stores/subscription-store';
import { recommendationApi, portfolioApi, tradeApi } from '@/lib/api-client';
import { UpgradeGate } from '@/components/ui/upgrade-gate';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Recommendation, Portfolio } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  buy: TrendingUp,
  sell: AlertTriangle,
  rebalance: Target,
  tax_harvest: DollarSign,
  risk_alert: AlertTriangle,
  opportunity: TrendingUp,
};

const priorityColors = {
  high: 'negative',
  medium: 'warning',
  low: 'neutral',
  critical: 'negative',
} as const;

const statusColors = {
  pending: 'neutral',
  viewed: 'warning',
  accepted: 'positive',
  dismissed: 'negative',
} as const;

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const { canAccess } = useSubscriptionStore();

  const canExecuteTrades = canAccess(Features.BROKER_EXECUTION);

  useEffect(() => {
    const load = async () => {
      try {
        const [recsRes, portfoliosRes] = await Promise.all([
          recommendationApi.list().catch(() => ({ data: [] })),
          portfolioApi.list().catch(() => ({ data: [] })),
        ]);
        const recs = Array.isArray(recsRes.data) ? recsRes.data as Recommendation[] : [];
        setRecommendations(recs);
        const ports = Array.isArray(portfoliosRes.data) ? portfoliosRes.data : [];
        setPortfolios(ports);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleGenerateNew = async () => {
    try {
      const res = await recommendationApi.generate();
      if (Array.isArray(res.data)) {
        setRecommendations(res.data as Recommendation[]);
      }
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
    }
  };

  const handleRequestExecution = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setExecutionModalOpen(true);
  };

  const handleSubmitExecution = async (data: {
    recommendationId: string;
    portfolioId: string;
    quantity: number;
    orderType: string;
    limitPrice?: number;
    userNotes?: string;
  }) => {
    await tradeApi.requestExecution({
      recommendationId: data.recommendationId,
      portfolioId: data.portfolioId,
      quantity: data.quantity,
      orderType: data.orderType,
      limitPrice: data.limitPrice,
      userNotes: data.userNotes,
    });
  };

  if (!canAccess(Features.BASIC_RECOMMENDATIONS)) {
    return (
      <>
        <Header title="AI Recommendations" subtitle="Personalised investment recommendations" />
        <UpgradeGate
          requiredTier="pro"
          featureName="AI Recommendations"
          description="Get personalised buy, sell, and rebalance recommendations tailored to your portfolio with ClearFlow Pro."
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header title="AI Recommendations" subtitle="Loading..." />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary text-sm">Loading recommendations...</span>
          </div>
        </div>
      </>
    );
  }

  const pendingCount = recommendations.filter(r => r.status === 'pending').length;
  const acceptedCount = recommendations.filter(r => r.status === 'accepted').length;
  const totalImpact = recommendations.reduce((sum, r) => sum + ((r.potentialImpact as number) || 0), 0);
  const avgConfidence = recommendations.length > 0
    ? Math.round(recommendations.reduce((sum, r) => sum + ((r.confidenceScore as number) || 0), 0) / recommendations.length * 100)
    : 0;

  return (
    <>
      <Header
        title="AI Recommendations"
        subtitle="Personalized investment insights powered by machine learning"
        actions={
          <Button variant="primary" onClick={handleGenerateNew}>
            <Brain className="w-4 h-4" />
            Generate New
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card className="p-4 md:p-6">
          <div className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Pending Actions</div>
          <div className="text-2xl md:text-3xl font-bold">{pendingCount}</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Potential Impact</div>
          <div className="text-2xl md:text-3xl font-bold text-success">{formatCurrency(totalImpact)}</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Accepted</div>
          <div className="text-2xl md:text-3xl font-bold">{acceptedCount}</div>
        </Card>
        <Card className="p-4 md:p-6">
          <div className="text-text-muted text-xs md:text-sm mb-1 md:mb-2">Avg. Confidence</div>
          <div className="text-2xl md:text-3xl font-bold">{avgConfidence}%</div>
        </Card>
      </div>

      {/* Recommendations List */}
      <Card>
        <CardHeader title="All Recommendations" />
        {recommendations.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-text-muted text-sm">
            No recommendations yet. Click "Generate New" to get AI-powered suggestions.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const recType = (rec.type as string) || 'opportunity';
              const Icon = iconMap[recType] || TrendingUp;
              const priority = (rec.priority as string) || 'medium';
              const status = (rec.status as string) || 'pending';
              const details = (rec.details || {}) as Record<string, unknown>;

              return (
                <div
                  key={rec.id as string}
                  className={`p-4 md:p-6 bg-background-tertiary rounded-xl border-l-4 ${
                    priority === 'high' || priority === 'critical'
                      ? 'border-accent-danger'
                      : priority === 'medium'
                      ? 'border-warning'
                      : 'border-accent-primary'
                  } transition-all duration-200 hover:translate-x-1`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-background-primary" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-base md:text-lg font-semibold mb-1">{rec.title as string}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={priorityColors[priority as keyof typeof priorityColors] || 'neutral'}>
                              {priority.toUpperCase()}
                            </Badge>
                            <Badge variant={statusColors[status as keyof typeof statusColors] || 'neutral'}>
                              {status}
                            </Badge>
                            {!!(details as Record<string, unknown>).symbol && (
                              <Badge variant="neutral">{(details as Record<string, unknown>).symbol as string}</Badge>
                            )}
                            {!!rec.createdAt && (
                              <span className="text-xs text-text-muted font-mono">
                                {formatRelativeTime(rec.createdAt as string)}
                              </span>
                            )}
                          </div>
                        </div>
                        {!!rec.confidenceScore && (
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-xs text-text-muted mb-1">Confidence</div>
                            <div className="text-base md:text-lg font-bold font-mono text-accent-primary">
                              {Math.round((rec.confidenceScore as number) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed mb-3 md:mb-4">
                        {rec.description as string}
                      </p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {!!rec.potentialImpact && (
                          <div className="text-sm">
                            <span className="text-text-muted">Potential Impact: </span>
                            <span className="text-success font-semibold font-mono">
                              +{formatCurrency(rec.potentialImpact as number)}
                            </span>
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                            {canExecuteTrades && (recType === 'buy' || recType === 'sell') && !!details.symbol && (
                              <button
                                onClick={() => handleRequestExecution(rec)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-accent-secondary/10 text-accent-secondary rounded-lg hover:bg-accent-secondary/20 transition-colors text-sm font-medium"
                              >
                                <Briefcase className="w-4 h-4" />
                                Request Execution
                              </button>
                            )}
                            <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium">
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-background-secondary text-text-secondary rounded-lg hover:bg-background-primary transition-colors text-sm font-medium">
                              <X className="w-4 h-4" />
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <InvestmentDisclaimer className="mt-6" />
      </Card>

      {/* Broker Execution Modal */}
      {selectedRecommendation && (
        <BrokerExecutionModal
          isOpen={executionModalOpen}
          onClose={() => {
            setExecutionModalOpen(false);
            setSelectedRecommendation(null);
          }}
          recommendation={{
            id: selectedRecommendation.id as string,
            userId: '',
            type: (selectedRecommendation.type as Recommendation['type']) || 'buy',
            title: (selectedRecommendation.title as string) || '',
            description: (selectedRecommendation.description as string) || '',
            confidenceScore: selectedRecommendation.confidenceScore as number,
            potentialImpact: selectedRecommendation.potentialImpact as number,
            priority: (selectedRecommendation.priority as Recommendation['priority']) || 'medium',
            status: (selectedRecommendation.status as Recommendation['status']) || 'pending',
            createdAt: (selectedRecommendation.createdAt as string) || new Date().toISOString(),
            details: selectedRecommendation.details as Record<string, unknown>,
          }}
          portfolios={portfolios}
          onSubmit={handleSubmitExecution}
        />
      )}
    </>
  );
}
