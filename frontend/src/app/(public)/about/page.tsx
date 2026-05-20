'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Users, Target, ArrowRight } from 'lucide-react';

const VALUES = [
  {
    icon: Shield,
    title: 'Transparency First',
    description:
      'Every recommendation comes with a clear explanation. We never give you a signal without showing you why.',
  },
  {
    icon: Users,
    title: 'Investor in Control',
    description:
      'No automatic trading. Ever. You review, you decide, you approve. We provide intelligence — not autonomy.',
  },
  {
    icon: TrendingUp,
    title: 'Built for Nigeria',
    description:
      'Designed around the NGX, Nigerian macroeconomics, and the realities of retail investing in West Africa.',
  },
  {
    icon: Target,
    title: 'Accessible Intelligence',
    description:
      'Professional-grade tools without the jargon. We translate complex financial data into clear, actionable insight.',
  },
];

const TEAM = [
  {
    name: 'John Omaji',
    role: 'Chief Executive Officer',
    bio: '',
  },
  {
    name: 'Sena Atim',
    role: 'Chief Technology Officer',
    bio: '',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            We exist to close the gap between retail and institutional investing
          </h1>
          <p className="text-lg text-text-secondary">
            ClearFlow was built because everyday Nigerian investors deserve the same quality of
            financial intelligence that institutional traders take for granted — without needing a
            Bloomberg terminal or a fund manager on speed dial.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-background-secondary border border-border rounded-2xl p-8 md:p-12 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">Our Mission</h2>
          <p className="text-text-muted italic">Coming soon.</p>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-10">
            What We Stand For
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

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-10">
            The Team
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-background-secondary border border-border rounded-xl p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-accent-primary">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{member.name}</h3>
                <p className="text-xs text-accent-primary">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-3xl p-8 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Join Us on the Mission
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
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
    </div>
  );
}
