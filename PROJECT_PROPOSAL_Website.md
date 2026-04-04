# Project Proposal: Jbryanson Globals Limited — Corporate & Marketing Website

**Prepared for:** Jbryanson Globals Limited
**Product:** ClearFlow — AI-Powered Investment Intelligence Platform
**Document Type:** Website Development Project Proposal
**Date:** March 31, 2026
**Version:** 1.0

---

## 1. Executive Summary

Jbryanson Globals Limited currently operates ClearFlow, a sophisticated AI-powered investment intelligence platform with a fully built dashboard application. However, the company lacks a public-facing corporate and marketing website — the primary touchpoint for potential clients, investors, and partners.

This proposal outlines the development of a professional, high-conversion marketing and corporate website that:
- Establishes Jbryanson Globals Limited's brand presence online
- Markets ClearFlow's features to prospective users
- Drives user acquisition with subscription funnel integration
- Builds trust through transparency, compliance information, and company credentials
- Supports the platform's three-tier subscription model (Free, Pro, Premium)

---

## 2. Problem Statement

Without a dedicated marketing website, the company faces the following challenges:

- **No discoverable online presence** — Potential clients cannot find or learn about ClearFlow organically
- **No conversion funnel** — There is no pathway from awareness to sign-up outside of direct referral
- **No trust signals** — New users have no page to review the company's background, team, compliance, or legal standing before registering
- **No SEO strategy** — The platform cannot rank in search engines for investment-related keywords
- **No product storytelling** — Features are only visible after account creation, leaving first-time visitors with nothing to evaluate

---

## 3. Proposed Solution

Develop a fully responsive, performant, and visually consistent corporate + marketing website for Jbryanson Globals Limited, aligned with ClearFlow's existing dark-themed, neon-accented design system.

The site will serve as the top of the acquisition funnel — from landing to free-tier sign-up — and as the authoritative source of company information.

---

## 4. Scope of Work

### 4.1 Pages & Sections

#### Public Marketing Pages

| Page | Description |
|---|---|
| **Home / Landing** | Hero section, value proposition, feature highlights, testimonials, CTA to sign up |
| **Features** | Deep-dive into ClearFlow modules: Portfolio, AI Advisor, Risk, Tax, Analytics, NGX |
| **Pricing** | Tier comparison (Free / Pro / Premium), FAQs, CTA buttons |
| **About Us** | Company story, mission, team profiles, founding values |
| **Blog / Insights** | Market insights, investment tips, product updates (SEO-focused) |
| **Contact** | Contact form, support email, office information |
| **Careers** | Open roles and company culture (optional Phase 2) |

#### Legal & Compliance Pages

| Page | Description |
|---|---|
| **Privacy Policy** | Data collection, storage, and usage disclosures |
| **Terms of Service** | User agreement and platform usage terms |
| **Investment Disclaimer** | Regulatory disclaimer for AI-generated recommendations |
| **Cookie Policy** | Cookie consent and management |

#### Functional Pages

| Page | Description |
|---|---|
| **Sign Up** | Registration form (integrated with existing `/auth/register` endpoint) |
| **Login** | Authentication form (integrated with existing `/auth/login` endpoint) |
| **Password Reset** | Forgot password flow |

---

### 4.2 Key Features

#### Design & Branding
- Pixel-perfect implementation of ClearFlow's design system:
  - Background: `#0a0e14`, `#141922`, `#1a2030`
  - Accent: `#00ffaa` (mint green), `#00d4ff` (cyan), `#ff4466` (alert)
  - Typography: Instrument Sans (UI) + JetBrains Mono (data/code)
  - Animations: gradient-shift, fade-in-up, chart-pulse
- Fully responsive across mobile, tablet, and desktop
- Accessible (WCAG 2.1 AA compliance)

#### Conversion Optimization
- Prominent CTAs on every page linking to sign-up
- Pricing page with feature comparison table
- Animated feature demos (screenshots or interactive previews)
- Social proof: testimonials, stats (e.g., portfolios managed, uptime)
- Urgency cues for Pro/Premium tiers

#### SEO & Performance
- Server-side rendering via Next.js for search engine visibility
- Optimized meta tags, Open Graph, and structured data (JSON-LD)
- Sitemap and robots.txt
- Core Web Vitals optimized (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- Blog with markdown/CMS support for content marketing

#### Integration
- Auth forms connected to existing FastAPI backend (`/api/v1/auth`)
- Newsletter signup (Mailchimp or similar)
- Analytics (Google Analytics 4 + optional Hotjar)
- Cookie consent banner (GDPR-compliant)
- Live chat widget (Intercom or Crisp — optional)

---

## 5. Technical Approach

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Consistent with dashboard; SSR + SSG; best-in-class SEO |
| **Language** | TypeScript | Type safety; consistent with dashboard codebase |
| **Styling** | Tailwind CSS 3.4 | Reuse existing Tailwind config and design tokens |
| **Animations** | Framer Motion | Smooth, production-grade page animations |
| **CMS (Blog)** | Contentlayer + MDX | File-based blog; zero vendor lock-in |
| **Forms** | React Hook Form + Zod | Consistent with dashboard validation approach |
| **Analytics** | Google Analytics 4 | Industry standard web analytics |
| **Hosting** | Vercel | Zero-config Next.js deployment; global CDN |
| **DNS/CDN** | Cloudflare | DDoS protection, caching, SSL |

### 5.2 Architecture

```
Website (Next.js - Vercel)
├── Static Pages (SSG)       — Home, Features, Pricing, About, Legal
├── Dynamic Pages (SSR)      — Blog posts, individual feature pages
├── API Routes               — Contact form, newsletter signup
└── Auth Integration         — Login/Register → FastAPI backend
```

The website will be a **separate Next.js application** from the dashboard, deployed independently, but sharing the same design system, TypeScript types for auth, and backend API endpoints.

### 5.3 Repository Structure

```
clearflow-website/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Home
│   │   ├── features/
│   │   ├── pricing/
│   │   ├── about/
│   │   ├── blog/
│   │   ├── contact/
│   │   ├── login/
│   │   ├── register/
│   │   └── legal/
│   ├── components/
│   │   ├── sections/          # Page sections (Hero, Features, Pricing, etc.)
│   │   ├── layout/            # Header, Footer, Navigation
│   │   └── ui/                # Shared UI components (Button, Card, Badge)
│   ├── content/               # MDX blog posts and documentation
│   ├── lib/                   # API client, utilities
│   └── styles/                # Global styles
├── tailwind.config.ts         # Shared design tokens with dashboard
├── next.config.js
└── package.json
```

---

## 6. Design Direction

### 6.1 Homepage Layout (Above the Fold)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo: ClearFlow]                    [Login]  [Get Started] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│    AI-Powered Investment Intelligence                    │
│    for the Modern Investor                               │
│                                                          │
│    [Animated dashboard preview / mockup]                 │
│                                                          │
│    [Start Free]          [View Pricing]                  │
│                                                          │
│    Trusted by X investors · Y portfolios managed         │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Feature Highlights Section

Six feature cards with animated icons:
- Portfolio Tracking
- AI Advisor
- Risk Management
- Tax Optimization
- Market Analytics
- NGX (Nigerian Exchange)

### 6.3 Pricing Page Structure

Three-column pricing card layout:

| Free | Pro | Premium |
|---|---|---|
| $0/mo | $X/mo | $X/mo |
| News feed | All Free + | All Pro + |
| Health Cards | Portfolio tracking | Tax optimization |
| Basic screener | AI recommendations | Robo-advisor |
| | NGX module | Priority support |
| [Get Started] | [Start Pro] | [Go Premium] |

---

## 7. Project Phases & Timeline

### Phase 1 — Foundation (Weeks 1–2)
- Project setup: Next.js app, Tailwind config, design tokens
- Component library: Button, Card, Badge, Input, Navigation, Footer
- Home page (hero, features overview, CTA sections)
- Login and Register pages (auth integration)

### Phase 2 — Core Pages (Weeks 3–4)
- Features page (individual section per module)
- Pricing page (tier cards + FAQ)
- About Us page (company info, team, mission)
- Legal pages (Privacy Policy, Terms, Disclaimer, Cookie Policy)

### Phase 3 — Content & SEO (Weeks 5–6)
- Blog/Insights setup with Contentlayer + MDX
- 3–5 initial blog posts for SEO seeding
- Meta tags, Open Graph, structured data
- Sitemap and robots.txt
- Google Analytics 4 integration

### Phase 4 — Polish & Launch (Week 7)
- Contact page with working form
- Cookie consent banner
- Accessibility audit and fixes
- Performance optimization (Lighthouse score ≥ 90)
- Cross-browser and device testing
- Vercel deployment + Cloudflare DNS

### Phase 5 — Post-Launch (Ongoing)
- Blog content cadence (2 posts/month)
- A/B testing on CTA variants
- Analytics review and conversion optimization
- Careers page (optional)
- Live chat integration (optional)

---

## 8. Deliverables

| # | Deliverable | Phase |
|---|---|---|
| 1 | Design mockups (Figma) for all core pages | 1 |
| 2 | Component library (shared with dashboard design system) | 1 |
| 3 | Home page (fully responsive) | 1 |
| 4 | Auth pages integrated with backend | 1 |
| 5 | Features, Pricing, About pages | 2 |
| 6 | Legal pages (4 documents) | 2 |
| 7 | Blog system with initial posts | 3 |
| 8 | SEO configuration and sitemap | 3 |
| 9 | Analytics setup | 3 |
| 10 | Contact form with email delivery | 4 |
| 11 | Cookie consent (GDPR) | 4 |
| 12 | Full deployment to production | 4 |
| 13 | Lighthouse performance report (≥ 90) | 4 |
| 14 | Post-launch monitoring setup | 5 |

---

## 9. Success Metrics

After launch, the website's performance will be tracked against these KPIs:

| Metric | Target (3 months post-launch) |
|---|---|
| Organic search impressions | > 5,000/month |
| Monthly unique visitors | > 1,000/month |
| Sign-up conversion rate | > 3% of visitors |
| Bounce rate | < 55% |
| Average session duration | > 2 minutes |
| Lighthouse performance score | ≥ 90 |
| Lighthouse accessibility score | ≥ 90 |
| Core Web Vitals (LCP) | < 2.5 seconds |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Brand inconsistency with dashboard | Medium | Shared Tailwind config and design tokens from Day 1 |
| Poor SEO performance | Low | SSR/SSG via Next.js; structured data; blog strategy |
| Auth integration issues | Low | FastAPI backend already has `/auth` endpoints; use existing Axios client patterns |
| Legal content gaps | Medium | Engage legal counsel for compliance docs before launch |
| Scope creep (feature requests) | High | Strict phasing; defer non-essential pages to Phase 5+ |
| Low content volume at launch | Medium | Pre-write 5 blog posts before go-live |

---

## 11. Out of Scope

The following items are explicitly **not** included in this proposal:
- Changes to the existing ClearFlow dashboard application
- Mobile app development
- E-commerce or payment gateway integration on the website
- Custom CMS admin panel (blog managed via MDX files)
- Email marketing automation setup
- Social media management

These may be addressed in a separate proposal if required.

---

## 12. Assumptions

- The existing FastAPI backend remains available and unchanged for auth integration
- Jbryanson Globals Limited will provide company content (About text, team bios, photos)
- Legal documents will be reviewed and approved by authorized personnel before publishing
- Domain name and hosting credentials will be provided prior to Phase 4
- Subscription pricing (Pro/Premium amounts) will be confirmed before the Pricing page is built

---

## 13. Next Steps

Upon approval of this proposal:

1. **Kickoff meeting** — Align on timeline, content ownership, and design preferences
2. **Content brief** — Provide a questionnaire for company info, team details, and value proposition copy
3. **Design mockups** — Deliver Figma mockups for Home, Features, and Pricing pages for review
4. **Sprint 1 start** — Begin Phase 1 development

---

## 14. Appendix — ClearFlow Feature Reference

The following ClearFlow modules should each have dedicated sections on the Features page:

| Module | Key Selling Points |
|---|---|
| Portfolio Management | Multi-portfolio support, asset class diversity, auto-rebalance |
| AI Advisor | Groq-powered recommendations, confidence scoring, priority alerts |
| Risk Management | 6-axis risk scoring, stress testing, volatility monitoring |
| Tax Optimization | Capital gains tracking, loss harvesting, year-end reports |
| Market Analytics | Predictive trends, sector analysis, scenario simulations |
| NGX Module | Nigerian Exchange integration for local market investors |
| Stock Screener | Advanced filtering, health cards, technical indicators |
| Robo-Advisor | Automated rebalancing, contribution scheduling, rule builder |

---

*This proposal is prepared based on the current state of the ClearFlow dashboard codebase and is subject to revision following stakeholder review.*

---

## 15. Cost Estimate

### 15.1 One-Time Development Costs

These are costs incurred once during the build phase (Phases 1–4, ~7 weeks).

#### Option A — In-House / Solo Developer
If the website is built by an existing team member or the same developer who built the ClearFlow dashboard:

| Item | Estimated Cost |
|---|---|
| Frontend development (7 weeks) | ₦700,000 – ₦1,400,000 (~$500 – $1,000/wk) |
| UI/UX design (Figma mockups) | ₦150,000 – ₦300,000 |
| Content writing (copy + 5 blog posts) | ₦100,000 – ₦200,000 |
| SEO setup & configuration | Included in development |
| QA & cross-device testing | Included in development |
| **Total (Option A)** | **₦950,000 – ₦1,900,000** |

#### Option B — Freelance Developer (Nigeria Market Rate)
Hiring a skilled Nigerian freelance Next.js developer:

| Item | Estimated Cost |
|---|---|
| Frontend development (7 weeks) | ₦1,200,000 – ₦2,500,000 |
| UI/UX design (freelance designer) | ₦250,000 – ₦500,000 |
| Content writing (copywriter) | ₦150,000 – ₦300,000 |
| Project management overhead | ₦100,000 – ₦200,000 |
| **Total (Option B)** | **₦1,700,000 – ₦3,500,000** |

#### Option C — Freelance Developer (International / USD Rate)
Hiring via platforms like Upwork or Toptal:

| Item | USD Estimate | NGN Equivalent (~₦1,650/$) |
|---|---|---|
| Frontend development (7 weeks) | $3,500 – $8,000 | ₦5,775,000 – ₦13,200,000 |
| UI/UX design | $800 – $2,000 | ₦1,320,000 – ₦3,300,000 |
| Content writing | $300 – $700 | ₦495,000 – ₦1,155,000 |
| **Total (Option C)** | **$4,600 – $10,700** | **₦7,590,000 – ₦17,655,000** |

#### Option D — Web Development Agency (Nigeria)
Engaging a full-service Nigerian digital agency:

| Item | Estimated Cost |
|---|---|
| Full website development (all phases) | ₦3,000,000 – ₦8,000,000 |
| Design included | Yes |
| Content writing (varies) | May be extra ₦200,000 – ₦500,000 |
| **Total (Option D)** | **₦3,000,000 – ₦8,500,000** |

> **Recommendation:** Option A (in-house) is the most cost-efficient given that the ClearFlow dashboard is already built with the same tech stack, and the design system, API, and components are reusable. This significantly reduces build time and cost.

---

### 15.2 Recurring Infrastructure Costs (Monthly / Annual)

These are ongoing costs required to keep the website running after launch.

#### Hosting & Infrastructure

| Service | Plan | Cost |
|---|---|---|
| **Vercel** (hosting) | Hobby (free) or Pro ($20/mo) | $0 – $20/month |
| **Cloudflare** (CDN + DNS + SSL) | Free tier | $0/month |
| **Domain name** (e.g., jbryanson.com) | Annual renewal | ~$15 – $30/year |
| **Total infrastructure** | | **$0 – $20/month + ~$20/year** |

> Vercel's free tier is sufficient for a marketing website. Upgrade to Pro ($20/month) only if traffic exceeds 100GB bandwidth or for team collaboration features.

#### Third-Party Services

| Service | Purpose | Cost |
|---|---|---|
| **Google Analytics 4** | Web analytics | Free |
| **Google Search Console** | SEO monitoring | Free |
| **SendGrid / Resend** | Contact form email delivery | Free (up to 100 emails/day) |
| **Mailchimp** | Newsletter/email marketing | Free (up to 500 contacts), $13/month after |
| **Crisp / Tidio** | Live chat widget (optional) | Free tier available; Pro from $25/month |
| **Hotjar** | User heatmaps & recordings (optional) | Free (35 sessions/day); $32/month for more |

#### Monthly Recurring Cost Summary

| Scenario | Estimated Monthly Cost |
|---|---|
| Minimal (free tiers only) | **$0/month** |
| Standard (Vercel Pro + Mailchimp) | **$33/month** (~₦54,450/month) |
| Full-featured (+ live chat + Hotjar) | **$90/month** (~₦148,500/month) |

---

### 15.3 Ongoing Maintenance Costs

After launch, the website will require periodic maintenance:

| Task | Frequency | Estimated Cost |
|---|---|---|
| Content updates & blog posts | Monthly | ₦50,000 – ₦150,000/month |
| Bug fixes & minor updates | As needed | ₦30,000 – ₦100,000/month |
| Dependency & security updates | Quarterly | ₦50,000 – ₦150,000/quarter |
| SEO review & optimization | Quarterly | ₦75,000 – ₦200,000/quarter |
| **Total maintenance estimate** | Monthly | **₦80,000 – ₦250,000/month** |

> If maintained by an in-house developer, ongoing costs are minimal (time-based only). A retainer arrangement with a freelancer is the most flexible option.

---

### 15.4 Total Cost of Ownership (Year 1)

| Category | Low Estimate | High Estimate |
|---|---|---|
| One-time development (Option A — in-house) | ₦950,000 | ₦1,900,000 |
| Infrastructure & services (annual) | ₦0 | ₦396,000 |
| Maintenance (12 months) | ₦960,000 | ₦3,000,000 |
| **Year 1 Total (in-house)** | **₦1,910,000** | **₦5,296,000** |

| Category | Low Estimate | High Estimate |
|---|---|---|
| One-time development (Option B — freelancer) | ₦1,700,000 | ₦3,500,000 |
| Infrastructure & services (annual) | ₦0 | ₦396,000 |
| Maintenance (12 months) | ₦960,000 | ₦3,000,000 |
| **Year 1 Total (freelancer)** | **₦2,660,000** | **₦6,896,000** |

---

### 15.5 Return on Investment

The website's primary ROI driver is **user acquisition**. Even a modest conversion impact justifies the investment:

| Scenario | Monthly Sign-ups from Site | Pro Conversions (10%) | Monthly Revenue at ₦5,000/Pro/month |
|---|---|---|---|
| Conservative | 100 visitors → 3 sign-ups | 0.3 Pro | ₦1,500/month |
| Moderate | 500 visitors → 20 sign-ups | 2 Pro | ₦10,000/month |
| Optimistic | 2,000 visitors → 80 sign-ups | 8 Pro | ₦40,000/month |

> At the optimistic scenario, the website pays for itself within **6 months** of launch. This does not account for Premium tier conversions, which would significantly increase revenue per user.

---

### 15.6 Cost Reduction Opportunities

- **Reuse the dashboard design system** — Tailwind config, components, and API client are already built, saving 2–3 weeks of development time
- **Use free tiers** — Vercel, Cloudflare, Google Analytics, SendGrid all offer generous free tiers
- **Write initial content in-house** — Avoid copywriter fees by drafting About, Features, and blog content internally
- **Start with static blog (MDX)** — No CMS subscription needed; migrate to a paid CMS only if content volume demands it
- **Defer optional features** — Live chat, Hotjar, and Careers page can be added in Phase 5+ after validating traffic

*Cost estimates are based on March 2026 market rates and are subject to change. Exchange rate used: ₦1,650 per USD.*
