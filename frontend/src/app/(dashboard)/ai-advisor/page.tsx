'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, MessageSquare, BarChart3, Newspaper } from 'lucide-react';
import { StockAnalysisCard, AIChat, MarketInsights, FinancialNews } from '@/components/ai';
import { Disclaimer } from '@/components/ui/disclaimer';

type TabType = 'insights' | 'news' | 'analyze' | 'chat';

export default function AIAdvisorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('insights');

  const tabs = [
    { id: 'insights' as const, label: 'Market Insights', icon: BarChart3 },
    { id: 'news' as const, label: 'Financial News', icon: Newspaper },
    { id: 'analyze' as const, label: 'Stock Analysis', icon: TrendingUp },
    { id: 'chat' as const, label: 'Ask AI', icon: MessageSquare },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#0a0e14]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Investment Advisor</h1>
            <p className="text-gray-400">Powered by Google Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <Disclaimer variant="banner" />

      {/* Tabs */}
      <div className="flex gap-2 bg-[#141922] p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#00ffaa] to-[#00d4ff] text-[#0a0e14]'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'insights' && <MarketInsights />}
        {activeTab === 'news' && <FinancialNews />}
        {activeTab === 'analyze' && <StockAnalysisCard />}
        {activeTab === 'chat' && <AIChat />}
      </div>

      {/* Footer Disclaimer */}
      <Disclaimer variant="footer" />
    </div>
  );
}
