'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Brain, BookOpen, ArrowRight, X } from 'lucide-react';

const WHAT_WE_DO = [
  {
    number: '01',
    label: 'The Problem',
    description:
      'Retail investors on the NGX have lacked structured, credible, accessible analysis. That gap drives poor decisions and keeps people away from the market.',
  },
  {
    number: '02',
    label: 'Our Solution',
    description:
      'We build software tools and intelligence products that translate complex financial data into decisions retail investors can actually make.',
  },
  {
    number: '03',
    label: 'Who We Serve',
    description:
      'Everyday Nigerians: professionals, diaspora investors, and first-time capital markets participants. Accessible price points. Plain language. No jargon.',
  },
];

const VALUES = [
  {
    icon: CheckCircle,
    title: 'Accuracy Above Impact',
    description:
      'Every claim we publish is sourced. We do not trade credibility for a stronger headline. If the data does not support the claim, we do not make it.',
  },
  {
    icon: Users,
    title: 'Retail-First by Design',
    description:
      'Our tools and content are built for the everyday investor. Accessible language, practical framing, and price points that reflect who we serve.',
  },
  {
    icon: Brain,
    title: 'Intelligence, Not Noise',
    description:
      'The Nigerian capital markets produce a lot of data. We filter, structure, and contextualise — turning market information into investment intelligence.',
  },
  {
    icon: BookOpen,
    title: 'Regulatory Literacy',
    description:
      'We take CBN and NAICOM developments seriously. Understanding the regulatory environment is not optional for serious investors — and we make it accessible.',
  },
];

const FOUNDER_CREDENTIALS = [
  'Central Bank of Nigeria — 5 yrs',
  'MBA · Finance & Investment',
  'Adv. Diploma · Investment & Portfolio Mgmt',
  'CIS Level 1 — Passed · Level 2 Enrolled',
  'Project Management · Tritek Academy, UK',
];

export default function AboutPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-12 sm:mb-20 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6">
            We make Nigerian capital markets intelligence accessible to everyone.
          </h1>
          <p className="text-base sm:text-lg text-text-secondary">
            Clearflow Analytics is a UK-registered fintech platform built to give every retail
            investor the quality of market intelligence that institutions take for granted.
          </p>
        </div>

        {/* What We Do */}
        <div className="mb-20">
          <h2 className="text-sm font-semibold tracking-widest text-accent-primary uppercase mb-10 text-center">
            What We Do
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((item) => (
              <div
                key={item.number}
                className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors"
              >
                <span className="text-3xl font-bold text-accent-primary/30 mb-3 block">
                  {item.number}
                </span>
                <h3 className="text-base font-semibold text-text-primary mb-2">{item.label}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-background-secondary border border-border rounded-2xl p-8 md:p-12 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">Our Story</h2>
          <p className="text-text-secondary leading-relaxed mb-8">
            Clearflow Analytics was founded by John Omaji, a finance professional with five years at
            the Central Bank of Nigeria and deep experience across payments operations, currency
            processing, and lead analysis. Through that work, a clear gap became visible: the
            Nigerian retail investor is often navigating one of Africa's most dynamic capital markets
            without the tools to do it well.
          </p>
          <blockquote className="border-l-2 border-accent-primary pl-6 mb-8">
            <p className="text-text-primary italic text-lg leading-relaxed">
              "The data exists. The intelligence exists. What has been missing is the infrastructure
              to make it accessible to the people who need it most — retail investors on the NGX."
            </p>
          </blockquote>
          <p className="text-text-secondary leading-relaxed">
            Clearflow was built to close that gap. Starting with NGX equity analysis and expanding
            into regulatory intelligence, portfolio tools, and capital markets monitoring, the
            platform is designed from the ground up as a software product — not a newsletter, not a
            blog, but a structured intelligence platform built around the Nigerian investor's actual
            needs. Registered in the United Kingdom and focused on the Nigerian Exchange, Clearflow
            sits at the intersection of fintech rigour and capital markets expertise — with a mandate
            to serve retail, not just institutional, participants.
          </p>
        </div>

        {/* Founder */}
        <div className="mb-20">
          <h2 className="text-sm font-semibold tracking-widest text-accent-primary uppercase mb-10 text-center">
            Founder
          </h2>
          <div className="max-w-2xl mx-auto bg-background-secondary border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <button
                onClick={() => setLightboxOpen(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-accent-primary/20 hover:border-accent-primary/60 transition-colors cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                aria-label="View full photo of John Omaji"
              >
                <Image
                  src="/images/john-omaji.jpg"
                  alt="John Omaji — Founder & CEO, Clearflow"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover object-top"
                />
              </button>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary">John Omaji</h3>
                <p className="text-sm text-accent-primary mb-4">Founder & CEO — Clearflow</p>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  John brings five years of central banking experience from the Central Bank of
                  Nigeria, an MBA in Finance & Investment, and an Advanced Diploma in Investment and
                  Portfolio Management. He holds CIS Level 1 (Passed) and is currently enrolled in
                  CIS Level 2. He has also completed Project Management training with Tritek
                  Academy, UK. His work spans payments operations, currency processing, financial
                  analysis, and business analysis — giving Clearflow both the regulatory credibility
                  and analytical depth that the retail investment intelligence space demands.
                </p>
                <div className="flex flex-wrap gap-2">
                  {FOUNDER_CREDENTIALS.map((cred) => (
                    <span
                      key={cred}
                      className="px-3 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-xs text-text-primary"
                    >
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-10">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{value.title}</h3>
                <p className="text-sm text-text-secondary">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Registration Notice */}
        <div className="mb-20 text-center">
          <p className="text-xs text-text-muted max-w-2xl mx-auto">
            Clearflow Analytics Ltd is set to be registered in England and Wales under Companies
            House. Our focus market is the Nigerian Exchange Group (NGX) and the broader Nigerian
            capital markets ecosystem.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Join Us on the Mission
          </h2>
          <p className="text-base sm:text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Start investing smarter today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src="/images/john-omaji.jpg"
              alt="John Omaji — Founder & CEO, Clearflow"
              width={480}
              height={480}
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
              <p className="text-white font-semibold text-sm">John Omaji</p>
              <p className="text-white/70 text-xs">Founder & CEO — Clearflow</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
