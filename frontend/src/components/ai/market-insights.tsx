'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { aiApi, handleApiError } from '@/lib/api-client';

interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketInsightsData {
  marketSummary: {
    indices: MarketIndex[];
    marketSentiment: string;
    timestamp: string;
  };
  aiInsights: {
    marketOutlook: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    sectorsToWatch: string[];
    sectorsToAvoid?: string[];
    keyThemes: string[];
    riskFactors: string[];
    actionableTips?: string[];
  };
  generatedAt: string;
}

export function MarketInsights() {
  const [insights, setInsights] = useState<MarketInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await aiApi.getMarketInsights();
      setInsights(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-green-400/10 border-green-400/30';
      case 'bearish': return 'bg-red-400/10 border-red-400/30';
      default: return 'bg-yellow-400/10 border-yellow-400/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-[#00ffaa] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-[#00ffaa] text-[#0a0e14] rounded-lg font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const market = insights.marketSummary;
  const ai = insights.aiInsights || {};
  const indices = market?.indices || [];
  const sectorsToWatch = ai.sectorsToWatch || [];
  const sectorsToAvoid = ai.sectorsToAvoid || [];
  const keyThemes = ai.keyThemes || [];
  const riskFactors = ai.riskFactors || [];
  const actionableTips = ai.actionableTips || [];

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Market Overview</h3>
          <button
            onClick={fetchInsights}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indices.map((index) => (
            <div key={index.symbol} className="bg-[#0a0e14] rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">{index.name}</p>
              <p className="text-white text-xl font-bold">{index.price.toLocaleString()}</p>
              <div className={`flex items-center gap-1 text-sm ${index.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {index.changePercent >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Market Outlook */}
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">AI Market Analysis</h3>

        {/* Sentiment Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getSentimentBg(ai.sentiment)} mb-4`}>
          {ai.sentiment === 'bullish' && <TrendingUp className={`w-4 h-4 ${getSentimentColor(ai.sentiment)}`} />}
          {ai.sentiment === 'bearish' && <TrendingDown className={`w-4 h-4 ${getSentimentColor(ai.sentiment)}`} />}
          <span className={`font-semibold capitalize ${getSentimentColor(ai.sentiment)}`}>
            {ai.sentiment || 'neutral'} Outlook
          </span>
        </div>

        {/* Market Outlook */}
        <div className="bg-[#0a0e14] rounded-lg p-4 mb-6">
          <p className="text-gray-200 leading-relaxed">{ai.marketOutlook || 'Market analysis unavailable.'}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sectors to Watch */}
          {sectorsToWatch.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Sectors to Watch
              </h4>
              <div className="flex flex-wrap gap-2">
                {sectorsToWatch.map((sector, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-400/10 text-green-400 rounded-full text-sm"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sectors to Avoid */}
          {sectorsToAvoid.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                Use Caution
              </h4>
              <div className="flex flex-wrap gap-2">
                {sectorsToAvoid.map((sector, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-400/10 text-red-400 rounded-full text-sm"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Themes & Risks */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Themes */}
        <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#00ffaa]" />
            Key Market Themes
          </h4>
          <ul className="space-y-3">
            {keyThemes.map((theme, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-[#00ffaa]/10 text-[#00ffaa] flex items-center justify-center text-xs flex-shrink-0">
                  {i + 1}
                </span>
                {theme}
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Factors */}
        <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Risk Factors
          </h4>
          <ul className="space-y-3">
            {riskFactors.map((risk, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-300">
                <span className="w-6 h-6 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center text-xs flex-shrink-0">
                  !
                </span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Tips */}
      {actionableTips.length > 0 && (
        <div className="bg-gradient-to-r from-[#00ffaa]/10 to-[#00d4ff]/10 border border-[#00ffaa]/30 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4">Today&apos;s Actionable Tips</h4>
          <ul className="space-y-3">
            {actionableTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-200">
                <span className="text-[#00ffaa]">→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-gray-500 text-xs text-center">
        AI-generated market analysis for informational purposes only. Market conditions can change rapidly. Not financial advice.
      </p>
    </div>
  );
}
