'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    id: 'information-we-collect',
    number: '01',
    title: 'Information We Collect',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        We collect information you provide during registration (name, email, NIN), usage data, and
        device information to operate and improve the platform.
      </p>
    ),
  },
  {
    id: 'how-we-use',
    number: '02',
    title: 'How We Use Your Information',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Your data is used to verify your identity, process transactions, personalise your
        experience, and comply with regulatory obligations under Nigerian law.
      </p>
    ),
  },
  {
    id: 'kyc',
    number: '03',
    title: 'Identity Verification (KYC)',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Your NIN is hashed using a one-way cryptographic function before storage. We never store
        your raw NIN. This data is used solely for identity verification and fraud prevention.
      </p>
    ),
  },
  {
    id: 'data-sharing',
    number: '04',
    title: 'Data Sharing',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        We do not sell your personal data. We may share data with regulatory authorities as required
        by law, or with trusted service providers who assist in platform operations under strict
        confidentiality agreements.
      </p>
    ),
  },
  {
    id: 'data-security',
    number: '05',
    title: 'Data Security',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        We use industry-standard encryption and security practices to protect your data. Access is
        restricted to authorised personnel only.
      </p>
    ),
  },
  {
    id: 'your-rights',
    number: '06',
    title: 'Your Rights',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        You may request access to, correction of, or deletion of your personal data by contacting
        us. Note that some data may be retained for regulatory compliance.
      </p>
    ),
  },
  {
    id: 'contact',
    number: '07',
    title: 'Contact',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        For privacy concerns, contact our Data Protection Officer at{' '}
        <span className="text-accent-primary">privacy@clearflow.ng</span>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
              Privacy Policy
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
