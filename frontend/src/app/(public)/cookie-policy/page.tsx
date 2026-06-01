'use client';

import Link from 'next/link';
import { Cookie, ArrowLeft } from 'lucide-react';

const COOKIE_TYPES = [
  {
    label: 'Essential',
    description:
      'Required for the platform to function. Includes your authentication session token, which keeps you logged in securely across page visits. Without these, the platform cannot work.',
  },
  {
    label: 'Preference',
    description:
      'Remember your settings — such as your selected subscription plan view, billing period toggle, and display preferences — so they persist between sessions.',
  },
  {
    label: 'Performance & Analytics',
    description:
      'We may use anonymised analytics (such as Google Analytics 4) to understand how users navigate ClearFlow, which pages are visited most, and where errors occur. No personally identifiable information is collected through these cookies.',
  },
];

const BROWSER_CONTROLS = [
  'View cookies stored on your device',
  'Delete all or specific cookies',
  'Block cookies from specific sites',
  'Block third-party cookies',
];

const SECTIONS = [
  {
    id: 'what-are-cookies',
    number: '01',
    title: 'What Are Cookies?',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Cookies are small text files placed on your device when you visit a website. They help the
        site remember your preferences and actions over time, so you don't have to re-enter
        information each visit.
      </p>
    ),
  },
  {
    id: 'how-we-use',
    number: '02',
    title: 'How We Use Cookies',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          ClearFlow uses cookies and similar technologies solely to operate the platform and improve
          your experience. We do not use cookies for advertising or cross-site tracking.
        </p>
        <div className="space-y-3">
          {COOKIE_TYPES.map((type) => (
            <div
              key={type.label}
              className="bg-background-primary border border-border rounded-lg p-4"
            >
              <p className="text-xs font-semibold text-text-primary mb-1.5">{type.label} Cookies</p>
              <p className="text-xs text-text-secondary leading-relaxed">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'third-party',
    number: '03',
    title: 'Third-Party Cookies',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        Some features of ClearFlow may load content from trusted third-party services (such as
        market data providers). These services may set their own cookies, subject to their own
        privacy policies. We do not control third-party cookies.
      </p>
    ),
  },
  {
    id: 'local-storage',
    number: '04',
    title: 'Local Storage',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        In addition to cookies, ClearFlow uses your browser's local storage to persist application
        state — such as your authentication token and subscription tier — across sessions. This data
        stays on your device and is never transmitted to third parties.
      </p>
    ),
  },
  {
    id: 'managing',
    number: '05',
    title: 'Managing Cookies',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          You can manage or delete cookies through your browser settings at any time. Please note
          that disabling essential cookies will prevent you from logging in and using the platform.
          Disabling preference cookies means your settings will not be saved between visits.
        </p>
        <div className="bg-background-primary border border-border rounded-lg p-4">
          <p className="text-xs font-semibold text-text-primary mb-3">
            Most browsers allow you to:
          </p>
          <ul className="space-y-2">
            {BROWSER_CONTROLS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-primary/50 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'changes',
    number: '06',
    title: 'Changes to This Policy',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        We may update this Cookie Policy as we introduce new features or integrate new services.
        Significant changes will be communicated via the platform or by email.
      </p>
    ),
  },
  {
    id: 'contact',
    number: '07',
    title: 'Contact',
    content: (
      <p className="text-sm text-text-secondary leading-relaxed">
        If you have questions about our use of cookies, contact us at{' '}
        <span className="text-accent-primary">privacy@clearflow.ng</span>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
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
            <Cookie className="w-5 h-5 sm:w-7 sm:h-7 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3">
              Cookie Policy
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
