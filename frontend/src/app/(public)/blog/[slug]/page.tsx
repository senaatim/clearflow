import { PortableText, PortableTextComponents } from '@portabletext/react';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/schemaTypes/client'
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

export const revalidate = 60;

// ---- Image URL builder ----
const builder = imageUrlBuilder(client);
function urlFor(source: any) {
  return builder.image(source);
}

// ---- Types ----
interface Post {
  title: string;
  slug: { current: string };
  publishedAt: string;
  mainImage?: any;
  body: any;
  excerpt?: string;
  author?: {
    name: string;
    image?: any;
  };
}

// ---- Queries ----
const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  title,
  slug,
  publishedAt,
  mainImage,
  body,
  excerpt,
  author->{
    name,
    image
  }
}`;

const POST_SLUGS_QUERY = `*[_type == "post" && defined(slug.current)][].slug.current`;

// ---- Data fetching ----
async function getPost(slug: string): Promise<Post | null> {
  const post = await client.fetch(POST_QUERY, { slug });
  return post;
}

// ---- Static params (optional, enables build-time generation) ----
export async function generateStaticParams() {
  const slugs: string[] = await client.fetch(POST_SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

// ---- Metadata ----
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post not found' };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.mainImage
        ? [{ url: urlFor(post.mainImage).width(1200).height(630).url() }]
        : [],
    },
  };
}

// ---- Portable Text custom rendering ----
const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      return (
        <img
          src={urlFor(value).width(800).url()}
          alt={value.alt || ' '}
          className="my-8 rounded-lg w-full h-auto"
        />
      );
    },
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value.href.startsWith('/')
        ? 'noreferrer noopener'
        : undefined;
      return (
        <a
          href={value.href}
          rel={rel}
          target={rel ? '_blank' : undefined}
          className="text-[#38BDF8] underline decoration-[#38BDF8]/30 underline-offset-2 hover:decoration-[#38BDF8]"
        >
          {children}
        </a>
      );
    },
  },
  block: {
    normal: ({ children }) => (
      <p className="first-of-type:first-letter:float-left first-of-type:first-letter:font-extrabold first-of-type:first-letter:text-[56px] first-of-type:first-letter:leading-[48px] first-of-type:first-letter:pr-3 first-of-type:first-letter:pt-1 first-of-type:first-letter:text-[#38BDF8]">
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h2 className="font-bold text-2xl mt-12 mb-4 text-white">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-semibold text-xl mt-10 mb-3 text-white">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-2 border-[#38BDF8] pl-6 italic text-xl text-slate-300">
        {children}
      </blockquote>
    ),
  },
};

// ---- Page ----
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`${inter.variable} min-h-screen bg-[#080B14] relative`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Ambient glow, matching hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, #38BDF8 0%, transparent 70%)',
        }}
      />

      <article className="relative pb-24">
        {/* Title block */}
        <header className="max-w-[680px] mx-auto px-6 pt-20 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-4 py-1.5 text-sm font-medium text-[#38BDF8] mb-6">
            Blog
          </span>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
            {post.title}
          </h1>

          <div className="mx-auto mb-6 h-px w-16 bg-[#38BDF8]" />

          <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
            {post.author?.image && (
              <img
                src={urlFor(post.author.image).width(64).height(64).url()}
                alt={post.author.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            )}
            {post.author?.name && (
              <span className="font-medium text-slate-200">
                {post.author.name}
              </span>
            )}
            {post.author?.name && formattedDate && (
              <span aria-hidden="true">&middot;</span>
            )}
            {formattedDate && <time dateTime={post.publishedAt}>{formattedDate}</time>}
          </div>
        </header>

        {/* Hero image — slightly wider than the text column */}
        {post.mainImage && (
          <div className="max-w-[880px] mx-auto px-6 mb-14">
            <img
              src={urlFor(post.mainImage).width(1600).height(900).url()}
              alt={post.title}
              className="w-full h-auto rounded-xl border border-white/10"
            />
          </div>
        )}

        {/* Body copy — narrower column for readable line length */}
        <div className="max-w-[680px] mx-auto px-6">
          <div className="text-[19px] leading-[1.75] text-slate-300 [&_p]:mb-6 [&_img]:my-8 [&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10">
            <PortableText value={post.body} components={ptComponents} />
          </div>
        </div>
      </article>
    </div>
  );
}