'use client';

import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Calendar, Clock, Tag, ArrowRight, TrendingUp } from 'lucide-react';

const CATEGORIES = ['All', 'Market Analysis', 'Investing Tips', 'Platform Updates', 'NGX Spotlight'];

const POSTS = [
  {
    slug: 'understanding-ngx-equities',
    title: 'Understanding NGX Equities: A Beginner\'s Guide to the Nigerian Stock Exchange',
    excerpt: 'The Nigerian Exchange Group (NGX) lists over 150 equities across banking, consumer goods, oil & gas, and industrials. Here\'s what every retail investor needs to know before making their first trade.',
    category: 'NGX Spotlight',
    date: 'March 28, 2026',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'portfolio-diversification-strategies',
    title: '5 Portfolio Diversification Strategies for Nigerian Investors',
    excerpt: 'Concentration in a single sector is the most common risk retail investors take without knowing it. Learn how to spread risk intelligently across asset classes available on the NGX.',
    category: 'Investing Tips',
    date: 'March 22, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: 'reading-company-health-cards',
    title: 'How to Read ClearFlow Company Health Cards',
    excerpt: 'Our Health Cards distil a company\'s financials into six key metrics. This guide walks you through each metric and what it signals about a company\'s fundamentals.',
    category: 'Platform Updates',
    date: 'March 18, 2026',
    readTime: '4 min read',
    featured: false,
  },
  {
    slug: 'ai-investment-recommendations',
    title: 'How Our AI Generates Investment Recommendations',
    excerpt: 'ClearFlow\'s AI Advisor uses Groq-powered language models trained on financial data to surface buy/hold signals with confidence scores. Here\'s a transparent look at how it works.',
    category: 'Platform Updates',
    date: 'March 12, 2026',
    readTime: '7 min read',
    featured: false,
  },
  {
    slug: 'understanding-pe-ratios',
    title: 'P/E Ratios Explained: What Nigerian Investors Need to Know',
    excerpt: 'Price-to-earnings ratios are widely cited but often misunderstood. We break down what P/E actually tells you, how to compare across sectors, and why context matters in the Nigerian market.',
    category: 'Market Analysis',
    date: 'March 5, 2026',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: 'tax-on-investments-nigeria',
    title: 'Capital Gains Tax on Investments in Nigeria: What You Owe',
    excerpt: 'Many retail investors are unaware of their CGT obligations on equity sales. ClearFlow\'s Tax Optimization module helps Premium users track and minimise their tax liability.',
    category: 'Investing Tips',
    date: 'February 26, 2026',
    readTime: '6 min read',
    featured: false,
  },
];

function getCategoryColor(category: string) {
  switch (category) {
    case 'Market Analysis': return 'text-accent-primary bg-accent-primary/10';
    case 'Investing Tips': return 'text-accent-secondary bg-accent-secondary/10';
    case 'Platform Updates': return 'text-accent-info bg-accent-info/10';
    case 'NGX Spotlight': return 'text-accent-warning bg-accent-warning/10';
    default: return 'text-text-secondary bg-background-tertiary';
  }
}

export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-background-primary">
      <PublicHeader />

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-accent-primary text-xs font-medium mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Market Insights & Platform Updates
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              ClearFlow Insights
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Investment intelligence, market analysis, and guides to help you use ClearFlow more effectively.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-border text-text-secondary hover:text-text-primary hover:border-accent-primary/40 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          {featured && (
            <div className="mb-12 p-px rounded-2xl bg-gradient-to-br from-accent-primary/30 to-accent-secondary/20">
              <div className="bg-background-secondary rounded-2xl p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(featured.category)}`}>
                        <Tag className="w-3 h-3" />
                        {featured.category}
                      </span>
                      <span className="text-xs text-accent-primary font-semibold uppercase tracking-wider">Featured</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">
                      {featured.title}
                    </h2>
                    <p className="text-text-secondary leading-relaxed">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{featured.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.readTime}</span>
                    </div>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-accent-primary text-sm font-medium cursor-pointer hover:gap-3 transition-all">
                        Read article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors group cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                    <Tag className="w-3 h-3" />
                    {post.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-text-primary leading-snug mb-3 group-hover:text-accent-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{post.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{post.readTime}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Coming Soon notice */}
          <div className="mt-14 text-center p-8 bg-background-secondary border border-border rounded-xl">
            <p className="text-text-secondary text-sm">
              More articles coming soon. Subscribe to our newsletter to get notified when we publish new insights.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 bg-background-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              />
              <button className="px-5 py-2.5 bg-accent-primary text-background-primary text-sm font-semibold rounded-lg hover:bg-accent-primary/90 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
