import "server-only";

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

import { absoluteAssetUrl, absoluteUrl } from "@/lib/seo/site-url";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

type SitemapEntry = MetadataRoute.Sitemap[number];

interface SitemapBlogPost {
  id: number;
  title: string | null;
  summary: string | null;
  created_at: string | null;
}

interface SitemapProject {
  slug: string | null;
  title: string | null;
  summary: string | null;
  category: string | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
  cover_image_url: string | null;
}

export interface PublicSitemapLink {
  href: string;
  label: string;
  description: string;
  lastModified: string | null;
  meta: string;
}

export interface PublicSitemapGroup {
  title: string;
  description: string;
  links: PublicSitemapLink[];
}

const STATIC_ROUTES = [
  {
    path: "/",
    label: "Home",
    description: "Portfolio overview, featured projects, recent writing, and current availability.",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/projects",
    label: "Projects",
    description: "Public portfolio index for shipped work, case studies, and active builds.",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/blog",
    label: "Blog",
    description: "Public notes and articles on software, AI systems, and practical building.",
    changeFrequency: "weekly",
    priority: 0.85,
  },
  {
    path: "/contact",
    label: "Contact",
    description: "Project inquiry page for reaching Gio directly.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/sitemap",
    label: "Sitemap",
    description: "Human-readable directory of public pages on this site.",
    changeFrequency: "monthly",
    priority: 0.45,
  },
] as const;

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getSitemapProjects(), getSitemapBlogPosts()]);
  const latestContentDate = latestDate([
    ...projects.map((project) => project.updated_at ?? project.created_at),
    ...posts.map((post) => post.created_at),
  ]);

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: latestContentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  })) satisfies MetadataRoute.Sitemap;

  const projectEntries = projects
    .filter((project): project is SitemapProject & { slug: string } => Boolean(project.slug))
    .map((project) => {
      const image = absoluteAssetUrl(project.cover_image_url);

      return {
        url: absoluteUrl(`/projects/${encodeURIComponent(project.slug)}`),
        lastModified: toDate(project.updated_at ?? project.created_at),
        changeFrequency: "monthly",
        priority: 0.8,
        ...(image ? { images: [image] } : {}),
      } satisfies SitemapEntry;
    });

  const blogEntries = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.id}`),
    lastModified: toDate(post.created_at),
    changeFrequency: "monthly",
    priority: 0.75,
  })) satisfies MetadataRoute.Sitemap;

  return dedupeSitemap([...staticEntries, ...projectEntries, ...blogEntries]);
}

export async function buildPublicSitemapGroups(): Promise<PublicSitemapGroup[]> {
  const [projects, posts] = await Promise.all([getSitemapProjects(), getSitemapBlogPosts()]);
  const latestContentDate = latestDate([
    ...projects.map((project) => project.updated_at ?? project.created_at),
    ...posts.map((post) => post.created_at),
  ]).toISOString();

  return [
    {
      title: "Core pages",
      description: "Primary public routes for navigating the site.",
      links: STATIC_ROUTES.map((route) => ({
        href: route.path,
        label: route.label,
        description: route.description,
        lastModified: latestContentDate,
        meta: `${route.changeFrequency} updates`,
      })),
    },
    {
      title: "Projects",
      description: "Public project detail pages generated from Supabase.",
      links: projects
        .filter((project): project is SitemapProject & { slug: string } => Boolean(project.slug))
        .map((project) => ({
          href: `/projects/${encodeURIComponent(project.slug)}`,
          label: project.title ?? project.slug,
          description: project.summary ?? "Project case study and implementation notes.",
          lastModified: project.updated_at ?? project.created_at,
          meta: [project.category, project.status].filter(Boolean).join(" | ") || "Project",
        })),
    },
    {
      title: "Blog posts",
      description: "Public articles and notes generated from Supabase.",
      links: posts.map((post) => ({
        href: `/blog/${post.id}`,
        label: post.title ?? `Post ${post.id}`,
        description: post.summary ?? "Article from the public blog archive.",
        lastModified: post.created_at,
        meta: "Article",
      })),
    },
  ];
}

async function getSitemapProjects(): Promise<SitemapProject[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("slug, title, summary, category, status, updated_at, created_at, cover_image_url")
    .eq("visibility", "public")
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Could not load project sitemap entries.");
  }

  return (data ?? []) as SitemapProject[];
}

async function getSitemapBlogPosts(): Promise<SitemapBlogPost[]> {
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, summary, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Could not load blog sitemap entries.");
  }

  return (data ?? []) as SitemapBlogPost[];
}

function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function dedupeSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (seen.has(entry.url)) {
      return false;
    }

    seen.add(entry.url);
    return true;
  });
}

function latestDate(values: Array<string | null | undefined>): Date {
  const timestamps = values
    .map((value) => toDate(value).getTime())
    .filter((value) => Number.isFinite(value));

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();
}

function toDate(value: string | null | undefined): Date {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}
