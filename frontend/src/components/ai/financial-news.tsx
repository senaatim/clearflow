'use client';

import { useState, useEffect } from 'react';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import { aiApi, handleApiError } from '@/lib/api-client';

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  type: string;
  thumbnail: string;
  relatedSymbols: string[];
}

interface AISummary {
  summary: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  keyTopics: string[];
  marketImpact: string;
  notableStories?: Array<string | { headline?: string; explanation?: string }>;
}

interface NewsData {
  articles: NewsArticle[];
  aiSummary: AISummary | null;
  count: number;
  symbol?: string;
}

export function FinancialNews() {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const fetchMarketNews = async () => {
    setLoading(true);
    setError('');
    setActiveSymbol(null);

    try {
      const response = await aiApi.getMarketNews(20);
      setNewsData(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStockNews = async (symbol: string) => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError('');
    setActiveSymbol(symbol.toUpperCase());

    try {
      const response = await aiApi.getStockNews(symbol.toUpperCase(), 10);
      setNewsData(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketNews();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol.trim()) {
      fetchStockNews(searchSymbol.trim());
    }
  };

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

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
            onClick={fetchMarketNews}
            className="px-4 py-2 bg-[#00ffaa] text-[#0a0e14] rounded-lg font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                placeholder="Search news by stock symbol (e.g., AAPL)"
                className="w-full pl-10 pr-4 py-2 bg-[#0a0e14] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffaa] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#00ffaa] text-[#0a0e14] rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2">
            {activeSymbol && (
              <button
                onClick={fetchMarketNews}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                All News
              </button>
            )}
            <button
              onClick={activeSymbol ? () => fetchStockNews(activeSymbol) : fetchMarketNews}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeSymbol && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-gray-400 text-sm">Showing news for:</span>
            <span className="px-3 py-1 bg-[#00ffaa]/10 text-[#00ffaa] rounded-full text-sm font-medium">
              {activeSymbol}
            </span>
          </div>
        )}
      </div>

      {/* AI News Summary */}
      {newsData?.aiSummary && (
        <div className="bg-gradient-to-r from-[#00ffaa]/5 to-[#00d4ff]/5 border border-[#00ffaa]/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#00ffaa]" />
            <h3 className="text-lg font-semibold text-white">AI News Analysis</h3>
            <div className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${getSentimentBg(newsData.aiSummary.sentiment)}`}>
              {newsData.aiSummary.sentiment === 'bullish' && <TrendingUp className={`w-3.5 h-3.5 ${getSentimentColor(newsData.aiSummary.sentiment)}`} />}
              {newsData.aiSummary.sentiment === 'bearish' && <TrendingDown className={`w-3.5 h-3.5 ${getSentimentColor(newsData.aiSummary.sentiment)}`} />}
              <span className={`font-medium capitalize ${getSentimentColor(newsData.aiSummary.sentiment)}`}>
                {newsData.aiSummary.sentiment}
              </span>
            </div>
          </div>

          <p className="text-gray-200 leading-relaxed mb-4">{newsData.aiSummary.summary}</p>

          {/* Market Impact */}
          <div className="bg-[#0a0e14]/50 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Market Impact</p>
            <p className="text-gray-200 text-sm">{newsData.aiSummary.marketImpact}</p>
          </div>

          {/* Key Topics */}
          {newsData.aiSummary.keyTopics && newsData.aiSummary.keyTopics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newsData.aiSummary.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-full text-xs"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* News Articles */}
      <div className="bg-[#141922] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Newspaper className="w-5 h-5 text-[#00ffaa]" />
          <h3 className="text-lg font-semibold text-white">
            {activeSymbol ? `${activeSymbol} News` : 'Financial News'}
          </h3>
          <span className="ml-auto text-gray-500 text-sm">
            {newsData?.count || 0} articles
          </span>
        </div>

        {!newsData?.articles?.length ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No news articles found.</p>
            {activeSymbol && (
              <p className="text-gray-500 text-sm mt-1">Try a different stock symbol.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {newsData.articles.map((article, index) => (
              <a
                key={index}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 p-4 bg-[#0a0e14] rounded-lg hover:bg-[#0a0e14]/80 border border-transparent hover:border-gray-700 transition-all group"
              >
                {/* Thumbnail */}
                {article.thumbnail && (
                  <div className="hidden sm:block w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                    <img
                      src={article.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm leading-snug mb-1.5 group-hover:text-[#00ffaa] transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{article.publisher}</span>
                    {article.publishedAt && (
                      <span>{formatTimeAgo(article.publishedAt)}</span>
                    )}
                  </div>
                  {article.relatedSymbols.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {article.relatedSymbols.slice(0, 5).map((sym) => (
                        <span
                          key={sym}
                          className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link Icon */}
                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-[#00ffaa] flex-shrink-0 mt-1 transition-colors" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-gray-500 text-xs text-center">
        News sourced from Yahoo Finance. AI summaries are for informational purposes only. Not financial advice.
      </p>
    </div>
  );
}
