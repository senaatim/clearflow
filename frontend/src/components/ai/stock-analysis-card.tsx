'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Clock, Loader2 } from 'lucide-react';
import { aiApi, handleApiError } from '@/lib/api-client';

interface StockAnalysis {
  symbol: string;
  name: string;
  currentPrice: number;
  sector: string;
  analysis: {
    action: 'buy' | 'hold' | 'sell';
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    targetPrice: number;
    timeHorizon: 'short_term' | 'long_term';
    reasoning: string;
    keyFactors: string[];
    risks: string[];
  };
  technicals: {
    rsi?: number;
    rsiSignal?: string;
    sma_20?: number;
    aboveSma_20?: boolean;
    momentum_1w?: number;
    momentum_1m?: number;
    volatility?: number;
  };
  generatedAt: string;
}

interface StockAnalysisCardProps {
  symbol?: string;
  onRequestExecution?: (analysis: StockAnalysis) => void;
  showExecutionButton?: boolean;
}

export function StockAnalysisCard({ symbol: initialSymbol, onRequestExecution, showExecutionButton = false }: StockAnalysisCardProps) {
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await aiApi.analyzeStock(symbol.toUpperCase());
      setAnalysis(response.data);
    } catch (err) {
      setError(handleApiError(err));
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-400 bg-green-400/10';
      case 'sell': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-5 h-5" />;
      case 'sell': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'high': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">AI Stock Analysis</h3>

      {/* Search Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="flex-1 bg-[#0a0e14] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa]"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !symbol.trim()}
          className="px-6 py-2 bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] text-[#0a0e14] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-white">{analysis.name}</h4>
              <p className="text-gray-400 text-sm">{analysis.symbol} • {analysis.sector}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${analysis.currentPrice.toFixed(2)}</p>
              <p className="text-gray-400 text-sm">Current Price</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className={`flex items-center gap-4 p-4 rounded-lg ${getActionColor(analysis.analysis.action)}`}>
            {getActionIcon(analysis.analysis.action)}
            <div className="flex-1">
              <p className="font-semibold uppercase">{analysis.analysis.action} Recommendation</p>
              <p className="text-sm opacity-80">{Math.round(analysis.analysis.confidence * 100)}% confidence</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span className="font-semibold">${analysis.analysis.targetPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs opacity-80">Target Price</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0a0e14] rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Risk Level</p>
              <p className={`font-semibold capitalize ${getRiskColor(analysis.analysis.riskLevel)}`}>
                {analysis.analysis.riskLevel}
              </p>
            </div>
            <div className="bg-[#0a0e14] rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Time Horizon</p>
              <p className="text-white font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {analysis.analysis.timeHorizon === 'short_term' ? '1-3 months' : '6+ months'}
              </p>
            </div>
            <div className="bg-[#0a0e14] rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">RSI (14)</p>
              <p className="text-white font-semibold">
                {analysis.technicals.rsi?.toFixed(1) || 'N/A'}
                {analysis.technicals.rsiSignal && (
                  <span className="text-xs text-gray-400 ml-1">({analysis.technicals.rsiSignal})</span>
                )}
              </p>
            </div>
            <div className="bg-[#0a0e14] rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Volatility</p>
              <p className="text-white font-semibold">
                {analysis.technicals.volatility ? `${analysis.technicals.volatility.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-[#0a0e14] rounded-lg p-4">
            <h5 className="text-white font-semibold mb-2">AI Analysis</h5>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.analysis.reasoning}</p>
          </div>

          {/* Key Factors */}
          {analysis.analysis.keyFactors && analysis.analysis.keyFactors.length > 0 && (
            <div>
              <h5 className="text-white font-semibold mb-2">Key Factors</h5>
              <ul className="space-y-2">
                {analysis.analysis.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#00ffaa] mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {analysis.analysis.risks && analysis.analysis.risks.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <h5 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risks to Consider
              </h5>
              <ul className="space-y-2">
                {analysis.analysis.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-red-400 mt-1">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Request Execution Button (Premium) */}
          {showExecutionButton && onRequestExecution && (
            <button
              onClick={() => onRequestExecution(analysis)}
              className="w-full py-3 bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] text-[#0a0e14] font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Request Broker Execution
            </button>
          )}

          {/* Disclaimer */}
          <p className="text-gray-500 text-xs text-center">
            AI-generated analysis for informational purposes only. Not financial advice.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && !error && (
        <div className="text-center py-8 text-gray-400">
          <p>Enter a stock symbol to get AI-powered analysis</p>
        </div>
      )}
    </div>
  );
}
