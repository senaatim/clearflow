'use client';

import Link from 'next/link';
import { ScrollText, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    id: 'acceptance',
    number: '01',
    title: 'Acceptance of Terms',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        By creating an account and using ClearFlow, you agree to be bound by these Terms of Service
        and all applicable laws and regulations. If you do not agree, you may not use the platform.
      </p>
    ),
  },
  {
    id: 'eligibility',
    number: '02',
    title: 'Eligibility',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        You must be at least 18 years of age and a resident of Nigeria to use ClearFlow. By
        registering, you confirm that the information you provide, including your NIN, is accurate
        and belongs to you.
      </p>
    ),
  },
  {
    id: 'account',
    number: '03',
    title: 'Account Registration',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        You are responsible for maintaining the confidentiality of your account credentials.
        ClearFlow is not liable for any loss resulting from unauthorised access to your account.
      </p>
    ),
  },
  {
    id: 'investment-risk',
    number: '04',
    title: 'Investment Risk',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        All investments carry risk. Past performance is not indicative of future results. ClearFlow
        does not guarantee returns and is not responsible for investment losses.
      </p>
    ),
  },
  {
    id: 'prohibited',
    number: '05',
    title: 'Prohibited Activities',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        You may not use ClearFlow for money laundering, fraud, or any activity that violates
        Nigerian law. We reserve the right to suspend accounts engaged in prohibited activities.
      </p>
    ),
  },
  {
    id: 'changes',
    number: '06',
    title: 'Changes to Terms',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        We may update these terms at any time. Continued use of the platform after changes
        constitutes acceptance of the updated terms.
      </p>
    ),
  },
  {
    id: 'contact',
    number: '07',
    title: 'Contact',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        For questions about these terms, contact us at{' '}
        <span className="text-accent-primary">support@clearflow.ng</span> or through the in-app
        support channel.
      </p>
    ),
  },
];

export default function TermsPage() {
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
        <div className="flex items-start gap-4 mb-10 sm:mb-14">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-5 h-5 sm:w-7 sm:h-7 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
              Terms of Service
            </h1>
            <span className="inline-block px-3 py-1 bg-background-secondary border border-border rounded-full text-xs text-text-muted">
              Last updated: March 2026
            </span>
          </div>
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
