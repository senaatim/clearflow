'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Star,
  BarChart3,
  PieChart,
  Shield,
  Layers,
  FileText,
  BookOpen,
  Search,
  ArrowRight,
} from 'lucide-react';

const CORE_PRODUCTS = [
  {
    icon: BarChart3,
    badge: '★  FLAGSHIP PRODUCT',
    title: 'NGX Equity Intelligence',
    description:
      'Deep-dive analysis of Nigerian Exchange Group (NGX) listed equities. From fundamental screeners to earnings breakdowns — everything a retail investor needs to understand a stock before they buy it.',
    details: [
      'FY financial analysis and earnings summaries',
      'Sector performance benchmarking',
      'Stock Under the Clearflow Lens — monthly featured stock analysis',
      'Price-to-earnings, ROE, and key ratio dashboards',
    ],
    flagship: true,
  },
  {
    icon: PieChart,
    badge: 'TOOL',
    title: 'Portfolio Tracker',
    description:
      'A purpose-built NGX portfolio management tool. Monitor your holdings, track cost basis, and measure realised and unrealised P&L — all in one place.',
    details: [
      'NGX-focused holdings dashboard',
      'Average cost and P&L calculator',
      'Quick price calculator for on-the-spot decisions',
      'Retail-friendly interface, no finance jargon',
    ],
    flagship: false,
  },
  {
    icon: Shield,
    badge: 'INTELLIGENCE',
    title: 'Regulatory Intelligence',
    description:
      'Stay ahead of policy shifts that move markets. Clearflow monitors CBN and NAICOM circulars and translates regulatory developments into plain-language investor briefings.',
    details: [
      'CBN monetary policy updates and impact analysis',
      'NAICOM insurance sector directives',
      'Retail investor-facing policy summaries',
      'Digest-format briefings for quick reading',
    ],
    flagship: false,
  },
  {
    icon: Layers,
    badge: 'TRACKER',
    title: 'Capital Markets Pipeline',
    description:
      'A live tracker of investment opportunities across the Nigerian capital markets. Commercial Papers, IPOs, FGN and State Bonds, and Eurobonds — consolidated and monitored in one dashboard.',
    details: [
      'Commercial Paper issuances and tenors',
      'Upcoming NGX IPOs and public offers',
      'FGN and State Government bond calendar',
      'Eurobond listings and yield tracking',
    ],
    flagship: false,
  },
];

const SERVICES = [
  {
    icon: FileText,
    title: 'Market Intelligence Briefs',
    description:
      'Regularly published briefings on NGX market activity, earnings season, and macroeconomic developments affecting Nigerian equities.',
  },
  {
    icon: BookOpen,
    title: 'Investor Education',
    description:
      'Plain-language guides and explainers on investing fundamentals, NGX mechanics, and portfolio construction for first-time and growing investors.',
  },
  {
    icon: Search,
    title: 'Sector Lens Reports',
    description:
      'Thematic deep-dives into NGX sectors — banking, healthcare, FMCG, and more — to help investors identify where opportunity is building.',
  },
];

const WHO_FOR = [
  'Retail investors on the NGX',
  'First-time stockmarket participants',
  'Diaspora investors tracking Nigerian markets',
  'Working professionals building wealth',
  'Investment club members',
  'Young professionals entering capital markets',
];

export default function FeaturesPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Intelligence that works for the everyday investor.
          </h1>
          <p className="text-base sm:text-lg text-text-secondary">
            Clearflow Analytics brings institutional-grade NGX market data to the retail investor —
            structured, accessible, and actionable.
          </p>
        </div>

        {/* Core Products */}
        <div className="mb-20">
          <h2 className="text-sm font-semibold tracking-widest text-accent-primary uppercase mb-8">
            Core Products
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {CORE_PRODUCTS.map((product) => (
              <div
                key={product.title}
                className={`bg-background-secondary border rounded-xl p-6 transition-colors ${
                  product.flagship
                    ? 'border-accent-primary/50 ring-1 ring-accent-primary/20'
                    : 'border-border hover:border-accent-primary/30'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                    <product.icon className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-accent-primary uppercase">
                      {product.badge}
                    </span>
                    <h3 className="text-lg font-semibold text-text-primary mt-0.5">{product.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">{product.description}</p>
                <ul className="space-y-1.5">
                  {product.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-xs text-text-muted">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-20">
          <h2 className="text-sm font-semibold tracking-widest text-accent-primary uppercase mb-8">
            Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{service.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who It's Built For */}
        <div className="mb-20 bg-background-secondary border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-xl font-bold text-text-primary mb-6">Who Clearflow is Built For</h2>
          <div className="flex flex-wrap gap-3">
            {WHO_FOR.map((group) => (
              <span
                key={group}
                className="px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-sm text-text-primary"
              >
                {group}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg text-text-secondary mb-8 max-w-xl mx-auto">
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
