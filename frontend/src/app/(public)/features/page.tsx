'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Users,
  PieChart,
  Shield,
  FileText,
  Bell,
  BarChart3,
  TrendingUp,
  Layers,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description:
      'Get intelligent Buy, Hold, and Sell recommendations powered by advanced AI algorithms analyzing market trends and your portfolio.',
    details: [
      'Real-time market analysis across NGX-listed stocks',
      'Clear reasoning behind every recommendation',
      'Risk-adjusted scoring for each signal',
      'Personalized to your portfolio and risk profile',
    ],
  },
  {
    icon: Users,
    title: 'Broker-Assisted Execution',
    description:
      'Execute trades through licensed brokers. No automatic trading — you stay in control while professionals handle execution.',
    details: [
      'Licensed and regulated broker partners',
      'You approve every trade before execution',
      'No algorithmic or automatic trading',
      'Full audit trail of all transactions',
    ],
  },
  {
    icon: PieChart,
    title: 'Portfolio Intelligence',
    description:
      'Track your investments in real-time with comprehensive performance analytics, growth charts, and benchmark comparisons.',
    details: [
      'Real-time portfolio valuation',
      'Performance vs NGX All-Share Index benchmarks',
      'Sector allocation and diversification analysis',
      'Historical growth tracking',
    ],
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description:
      'Understand your risk exposure with detailed risk scores, stress testing, and personalized risk alerts.',
    details: [
      'Portfolio-level risk scoring',
      'Concentration risk alerts',
      'Volatility and drawdown metrics',
      'Stress test simulations',
    ],
  },
  {
    icon: FileText,
    title: 'Detailed Reports',
    description:
      'Generate professional investment reports, tax summaries, and performance analysis that you can download and share.',
    details: [
      'Downloadable PDF reports',
      'Tax optimization summaries',
      'Performance attribution analysis',
      'Earnings and dividend tracking',
    ],
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description:
      'Stay informed with AI-powered notifications about market opportunities, portfolio events, and rebalancing suggestions.',
    details: [
      'Price target alerts',
      'Earnings announcement reminders',
      'Rebalancing suggestions',
      'Market-moving news notifications',
    ],
  },
  {
    icon: BarChart3,
    title: 'Full Stock Screener',
    description:
      'Filter and discover stocks across the Nigerian Exchange using dozens of financial and technical criteria.',
    details: [
      'Filter by P/E, P/B, dividend yield, and more',
      'Technical indicators and momentum screens',
      'Sector and industry filters',
      'Save and reuse custom screens',
    ],
  },
  {
    icon: TrendingUp,
    title: 'DCF Valuation Models',
    description:
      'Access discounted cash flow models built on company financials to identify undervalued opportunities.',
    details: [
      'Pre-built DCF models for major NGX stocks',
      'Adjustable assumptions for your own scenarios',
      'Intrinsic value vs market price comparison',
      'Model history and version tracking',
    ],
  },
  {
    icon: Layers,
    title: 'Macro Dashboard',
    description:
      'Monitor Nigeria-specific macroeconomic indicators that directly affect your investments.',
    details: [
      'Inflation, FX, and interest rate tracking',
      'CBN policy updates',
      'Oil price and fiscal indicator feeds',
      'Macro impact scoring on sectors',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Everything You Need to Invest Confidently
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Powerful tools and insights designed for retail investors who want professional-grade
            intelligence without the complexity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-accent-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary mb-4">{feature.description}</p>
              <ul className="space-y-1">
                {feature.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Start free and unlock more features as you grow. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
