import { sanityClient } from './client';
import { groq } from 'next-sanity';

export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  category: string;
  featured: boolean;
  readTime: string;
  publishedAt: string;
  coverImage?: { asset: { _ref: string }; hotspot?: object };
}

export interface SanityPostFull extends SanityPost {
  body: object[];
}

const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    category,
    featured,
    readTime,
    publishedAt,
    coverImage
  }
`;

const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    category,
    featured,
    readTime,
    publishedAt,
    coverImage,
    body
  }
`;

const slugsQuery = groq`
  *[_type == "post"] { "slug": slug.current }
`;

export async function getAllPosts(): Promise<SanityPost[]> {
  return sanityClient.fetch(postsQuery);
}

export async function getPostBySlug(slug: string): Promise<SanityPostFull | null> {
  return sanityClient.fetch(postBySlugQuery, { slug });
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  return sanityClient.fetch(slugsQuery);
}
