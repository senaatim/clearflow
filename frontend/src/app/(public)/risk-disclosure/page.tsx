'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const RISKS = [
  'Market risk — prices may move against your position',
  'Liquidity risk — you may be unable to sell an asset at a fair price',
  'Currency risk — where assets are denominated in foreign currencies',
  'Concentration risk — investing in too few assets or sectors',
  'Regulatory risk — changes in Nigerian or international financial regulations',
  'Volatility risk — particularly for emerging market securities including NGX-listed equities',
];

const SECTIONS = [
  {
    id: 'nature-of-service',
    number: '01',
    title: 'Nature of the Service',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary leading-relaxed">
          ClearFlow provides data-driven investment intelligence tools — including AI-generated
          analysis, market screeners, portfolio analytics, and educational content — for
          informational and research purposes only. All outputs from the platform, including AI
          recommendations, risk scores, and valuation models, are tools to support your own
          thinking, not directives to act.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          You are solely responsible for all investment decisions you make. ClearFlow does not
          execute trades, hold funds, manage portfolios, or act on your behalf in any financial
          market.
        </p>
      </div>
    ),
  },
  {
    id: 'investment-risk',
    number: '02',
    title: 'Investment Risk',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          All investments involve risk. The value of securities can go down as well as up. You may
          lose some or all of the money you invest. Past performance of any security, market, or
          analytical model does not guarantee future results.
        </p>
        <div className="bg-background-primary border border-border rounded-lg p-4">
          <p className="text-xs font-semibold text-text-primary mb-3">Specific risks include:</p>
          <ul className="space-y-2">
            {RISKS.map((risk) => (
              <li key={risk} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary/50 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'ai-content',
    number: '03',
    title: 'AI-Generated Content',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary leading-relaxed">
          ClearFlow uses artificial intelligence (powered by Groq) to generate analysis,
          recommendations, and insights. AI outputs are probabilistic and may contain errors,
          omissions, or outdated information. They do not reflect current market conditions in real
          time and should not be treated as definitive or infallible.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          You should independently verify any AI-generated information before acting on it.
        </p>
      </div>
    ),
  },
  {
    id: 'accuracy',
    number: '04',
    title: 'No Guarantee of Accuracy',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        While we strive to provide accurate and up-to-date data, ClearFlow makes no warranty —
        express or implied — that information on the platform is complete, accurate, or timely.
        Market data may be delayed. Valuation models depend on assumptions that may not hold.
      </p>
    ),
  },
  {
    id: 'regulatory-status',
    number: '05',
    title: 'Regulatory Status',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Clearflow Analytics Ltd is not registered with the Securities and Exchange Commission (SEC)
        of Nigeria as an investment adviser, portfolio manager, or stockbroker. ClearFlow is a
        software subscription service. Users are responsible for ensuring their own compliance with
        applicable laws and regulations when making investment decisions.
      </p>
    ),
  },
  {
    id: 'professional-advice',
    number: '06',
    title: 'Seek Professional Advice',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Before making any significant investment decision, we strongly encourage you to consult with
        a qualified financial advisor, tax professional, or legal counsel who understands your
        personal financial circumstances, risk tolerance, and investment objectives.
      </p>
    ),
  },
  {
    id: 'liability',
    number: '07',
    title: 'Limitation of Liability',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        To the maximum extent permitted by law, Clearflow Analytics Ltd, its directors, employees,
        and affiliates shall not be liable for any losses, damages, or costs arising from your use
        of or reliance on information provided by ClearFlow. Your use of the platform is at your own
        risk.
      </p>
    ),
  },
  {
    id: 'contact',
    number: '08',
    title: 'Contact',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        For questions regarding this disclosure, contact us at{' '}
        <span className="text-accent-primary">legal@clearflow.ng</span>.
      </p>
    ),
  },
];

export default function RiskDisclosurePage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-4 mb-8 sm:mb-10">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
              Risk Disclosure
            </h1>
            <span className="inline-block px-3 py-1 bg-background-secondary border border-border rounded-full text-xs text-text-muted">
              Last updated: March 2026
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-14 p-5 border border-yellow-500/30 bg-yellow-500/5 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-500/90 leading-relaxed">
            <span className="font-semibold">Important:</span> ClearFlow is an investment
            intelligence and analytics platform. We are not a licensed investment adviser,
            stockbroker, or asset manager. Nothing on this platform constitutes financial advice, a
            solicitation, or a recommendation to buy or sell any security.
          </p>
        </div>

        {/* Layout */}
        <div className="flex gap-10 items-start">

          {/* Sticky TOC */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28">
            <p className="text-xs font-semibold tracking-widest text-accent-primary uppercase mb-4">
              On this page
            </p>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors group"
                >
                  <span className="text-accent-primary/40 group-hover:text-accent-primary transition-colors font-mono">
                    {s.number}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="bg-background-secondary border border-border rounded-xl p-6 scroll-mt-28"
              >
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-xs font-mono text-accent-primary/50">{section.number}</span>
                  <h2 className="text-base font-semibold text-text-primary">{section.title}</h2>
                </div>
                {section.content}
              </div>
            ))}

            {/* Footer note */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                Clearflow Analytics Ltd — registered in England and Wales. Focus market: Nigerian
                Exchange Group (NGX).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
