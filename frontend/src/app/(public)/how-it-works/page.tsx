'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  UserCircle,
  Lightbulb,
  ClipboardList,
  HandIcon,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const STEPS = [
  {
    step: 1,
    icon: UserCircle,
    title: 'Subscribe & Connect',
    description:
      'Choose a plan that fits your investment goals and complete your investor profile in minutes.',
    details: [
      'Select Free, Pro, or Premium plan',
      'Set your risk tolerance and investment goals',
      'No credit card required to start',
      'Instant access after sign-up',
    ],
  },
  {
    step: 2,
    icon: Lightbulb,
    title: 'Get AI Insights',
    description:
      'ClearFlow analyses the market and your portfolio to surface personalised stock recommendations with clear reasoning.',
    details: [
      'Daily Buy, Hold, and Sell signals',
      'Every recommendation explained in plain language',
      'Risk scores attached to each signal',
      'Screener results updated in real time',
    ],
  },
  {
    step: 3,
    icon: ClipboardList,
    title: 'Review & Decide',
    description:
      'Dig into the data before committing. Read full reports, run DCF models, and check macro conditions at your own pace.',
    details: [
      'Detailed company health cards',
      'Earnings Decoder for financial statements',
      'Portfolio-level risk and allocation view',
      'Downloadable reports for offline review',
    ],
  },
  {
    step: 4,
    icon: HandIcon,
    title: 'Execute with Brokers',
    description:
      "When you're ready to trade, request execution through our licensed broker partners. You approve every order — nothing happens automatically.",
    details: [
      'Licensed, regulated broker network',
      'You remain in full control at all times',
      'No algorithmic or automatic trading',
      'Full transaction history and audit trail',
    ],
  },
];

const FAQS = [
  {
    question: 'Does ClearFlow trade on my behalf automatically?',
    answer:
      'No. ClearFlow never places trades automatically. Every order must be explicitly requested and approved by you before a broker executes it.',
  },
  {
    question: 'How are the AI recommendations generated?',
    answer:
      'Our models analyse company financials, price action, sector trends, and macro conditions to generate risk-adjusted signals. The reasoning behind each recommendation is always shown so you can judge for yourself.',
  },
  {
    question: 'Which exchange does ClearFlow cover?',
    answer:
      'ClearFlow focuses on the Nigerian Exchange (NGX), with coverage of equities, ETFs, and fixed-income instruments listed there.',
  },
  {
    question: 'Do I need investment experience to use ClearFlow?',
    answer:
      'No. ClearFlow is designed for retail investors at all levels. Plain-language explanations, company health cards, and step-by-step guidance make it accessible whether you are just starting out or have years of experience.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            How ClearFlow Works
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            From sign-up to your first informed trade in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 mb-24">
          {STEPS.map((item, index) => (
            <div
              key={item.step}
              className={`flex flex-col md:flex-row gap-8 items-start ${
                index % 2 === 1 ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Step card */}
              <div className="flex-1 bg-background-secondary border border-border rounded-xl p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-accent-primary/10 border-2 border-accent-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-accent-primary">{item.step}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">{item.title}</h2>
                </div>
                <p className="text-text-secondary mb-6">{item.description}</p>
                <ul className="space-y-2">
                  {item.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connector line for desktop */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:flex flex-col items-center justify-center w-8 pt-8">
                  <div className="w-0.5 h-24 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
            Common Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((item) => (
              <div
                key={item.question}
                className="bg-background-secondary border border-border rounded-xl p-6"
              >
                <h3 className="text-base font-semibold text-text-primary mb-2">{item.question}</h3>
                <p className="text-sm text-text-secondary">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Invest Smarter?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Join thousands of investors who use ClearFlow to make informed decisions. Start free
            today.
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
