'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard, PricingToggle } from '@/components/ui/pricing-card';
import { RiskWarning } from '@/components/ui/disclaimer';
import {
  TrendingUp,
  Shield,
  BarChart3,
  Brain,
  Users,
  FileText,
  Bell,
  PieChart,
  ArrowRight,
  CheckCircle,
  Play,
} from 'lucide-react';
import type { TierInfo, SubscriptionTier } from '@/types';

// Static tier data for landing page
const TIERS: TierInfo[] = [
  {
    tier: 'basic',
    name: 'Basic',
    description: 'Essential tools for getting started with smart investing',
    monthlyPrice: 9.99,
    yearlyPrice: 99.0,
    popular: false,
    features: [
      { name: 'Portfolio Tracking', description: '', included: true },
      { name: 'AI Recommendations', description: '', included: true },
      { name: 'Basic Analytics', description: '', included: true },
      { name: 'Market Summaries', description: '', included: true },
      { name: 'Advanced Analytics', description: '', included: false },
      { name: 'Tax Optimization', description: '', included: false },
      { name: 'Broker Execution', description: '', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    description: 'Advanced analytics and tax optimization for serious investors',
    monthlyPrice: 29.99,
    yearlyPrice: 299.0,
    popular: true,
    features: [
      { name: 'Portfolio Tracking', description: '', included: true },
      { name: 'AI Recommendations', description: '', included: true },
      { name: 'Basic Analytics', description: '', included: true },
      { name: 'Market Summaries', description: '', included: true },
      { name: 'Advanced Analytics', description: '', included: true },
      { name: 'Tax Optimization', description: '', included: true },
      { name: 'Broker Execution', description: '', included: false },
    ],
  },
  {
    tier: 'premium',
    name: 'Premium',
    description: 'Full-service investment intelligence with broker execution',
    monthlyPrice: 79.99,
    yearlyPrice: 799.0,
    popular: false,
    features: [
      { name: 'Portfolio Tracking', description: '', included: true },
      { name: 'AI Recommendations', description: '', included: true },
      { name: 'Basic Analytics', description: '', included: true },
      { name: 'Market Summaries', description: '', included: true },
      { name: 'Advanced Analytics', description: '', included: true },
      { name: 'Tax Optimization', description: '', included: true },
      { name: 'Broker Execution', description: '', included: true },
    ],
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description:
      'Get intelligent Buy, Hold, and Sell recommendations powered by advanced AI algorithms analyzing market trends and your portfolio.',
  },
  {
    icon: Users,
    title: 'Broker-Assisted Execution',
    description:
      'Execute trades through licensed brokers. No automatic trading - you stay in control while professionals handle execution.',
  },
  {
    icon: PieChart,
    title: 'Portfolio Intelligence',
    description:
      'Track your investments in real-time with comprehensive performance analytics, growth charts, and benchmark comparisons.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description:
      'Understand your risk exposure with detailed risk scores, stress testing, and personalized risk alerts.',
  },
  {
    icon: FileText,
    title: 'Detailed Reports',
    description:
      'Generate professional investment reports, tax summaries, and performance analysis that you can download and share.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description:
      'Stay informed with AI-powered notifications about market opportunities, portfolio events, and rebalancing suggestions.',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Subscribe & Connect',
    description: 'Choose a plan that fits your needs and set up your investment profile.',
  },
  {
    step: 2,
    title: 'Get AI Insights',
    description: 'Receive personalized stock recommendations with clear reasoning and risk levels.',
  },
  {
    step: 3,
    title: 'Review & Decide',
    description: 'Analyze recommendations, view detailed reports, and make informed decisions.',
  },
  {
    step: 4,
    title: 'Execute with Brokers',
    description: 'Request broker-assisted execution for trades you want to make. Stay in control.',
  },
];

export default function LandingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectTier = (tier: SubscriptionTier) => {
    // Navigate to register with selected tier
    window.location.href = `/register?plan=${tier}&billing=${billingPeriod}`;
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
              <TrendingUp className="w-4 h-4 text-accent-primary" />
              <span className="text-sm text-accent-primary font-medium">
                Financial Intelligence Platform
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 leading-tight">
              Invest Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                AI-Powered
              </span>{' '}
              Intelligence
            </h1>

            <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              ClearFlow provides intelligent investment recommendations and broker-assisted
              execution, helping retail investors make informed decisions without the complexity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="bg-background-secondary border border-border rounded-2xl p-4 shadow-2xl shadow-black/20">
              <div className="aspect-video bg-background-tertiary rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-accent-primary mx-auto mb-4 opacity-50" />
                  <p className="text-text-muted">Dashboard Preview</p>
                </div>
              </div>
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background-primary to-transparent" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything You Need to Invest Confidently
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Powerful tools and insights designed specifically for retail investors who want
              professional-grade intelligence without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-background-primary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              How ClearFlow Works
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Get started in minutes and begin making smarter investment decisions today.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-1/2" />
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-accent-primary/10 border-2 border-accent-primary flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-accent-primary">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Choose the plan that fits your investment journey. All plans include a 14-day free
              trial.
            </p>
          </div>

          <PricingToggle value={billingPeriod} onChange={setBillingPeriod} />

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <PricingCard
                key={tier.tier}
                tier={tier}
                billingPeriod={billingPeriod}
                onSelect={handleSelectTier}
              />
            ))}
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <RiskWarning />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Ready to Invest Smarter?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of investors who use ClearFlow to make informed investment decisions.
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button variant="secondary" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
