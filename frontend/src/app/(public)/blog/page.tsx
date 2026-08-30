import Link from 'next/link';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Calendar, Clock, Tag, ArrowRight, TrendingUp } from 'lucide-react';
import { getAllPosts, type SanityPost } from '@/lib/sanity/queries';

const CATEGORIES = ['All', 'Market Analysis', 'Investing Tips', 'Platform Updates', 'NGX Spotlight'];

function getCategoryColor(category: string) {
  switch (category) {
    case 'Market Analysis': return 'text-accent-primary bg-accent-primary/10';
    case 'Investing Tips': return 'text-accent-secondary bg-accent-secondary/10';
    case 'Platform Updates': return 'text-accent-info bg-accent-info/10';
    case 'NGX Spotlight': return 'text-accent-warning bg-accent-warning/10';
    default: return 'text-text-secondary bg-background-tertiary';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const revalidate = 60; // revalidate every 60 seconds

export default async function BlogPage() {
  const posts = await getAllPosts().catch(() => [] as SanityPost[]);

  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

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

          {/* Empty state */}
          {posts.length === 0 && (
            <div className="text-center py-20 text-text-secondary">
              No posts published yet. Check back soon.
            </div>
          )}

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
                      {featured.publishedAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />{formatDate(featured.publishedAt)}
                        </span>
                      )}
                      {featured.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />{featured.readTime}
                        </span>
                      )}
                    </div>
                    <div className="pt-2">
                      <Link
                        href={`/blog/${featured.slug.current}`}
                        className="inline-flex items-center gap-2 text-accent-primary text-sm font-medium hover:gap-3 transition-all"
                      >
                        Read article <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className="bg-background-secondary border border-border rounded-xl p-6 hover:border-accent-primary/30 transition-colors group flex flex-col"
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
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />{formatDate(post.publishedAt)}
                      </span>
                    )}
                    {post.readTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />{post.readTime}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Newsletter */}
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
