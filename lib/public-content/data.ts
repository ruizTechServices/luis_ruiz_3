import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface BlogPost {
  id: number;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  status: "draft" | "published";
  title: string | null;
  summary: string | null;
  tags: string | null;
  references: string | null;
  body: string | null;
}

export interface BlogComment {
  id: number;
  post_id: number;
  content: string | null;
  created_at: string | null;
}

export interface Project {
  id: number;
  title: string | null;
  slug: string;
  url: string | null;
  description: string | null;
  summary: string | null;
  status: string | null;
  category: string | null;
  featured: boolean | null;
  visibility: string | null;
  stack: string[] | null;
  role: string | null;
  context: string | null;
  problem: string | null;
  constraints: string | null;
  approach: string | null;
  architecture: string | null;
  decisions: string | null;
  outcomes: string | null;
  current_status: string | null;
  repo_url: string | null;
  live_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  availability: boolean;
  availability_text: string;
}

export async function getHomeContent() {
  const [settings, projects, posts] = await Promise.all([
    getSiteSettings(),
    getProjects({ limit: 3 }),
    getBlogPosts({ limit: 3 }),
  ]);

  return { settings, projects, posts };
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("availability, availability_text")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load site settings.");
  }

  return data as SiteSettings | null;
}

export async function getBlogPosts(options: { limit?: number } = {}): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts")
    .select("id, created_at, published_at, updated_at, status, title, summary, tags, references, body")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error("Could not load blog posts.");
  }

  const posts = (data ?? []) as BlogPost[];

  return typeof options.limit === "number" ? posts.slice(0, options.limit) : posts;
}

export async function getBlogPost(id: string): Promise<{
  post: BlogPost;
  comments: BlogComment[];
}> {
  const supabase = await createClient();
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId < 1) {
    notFound();
  }

  const [postResult, commentsResult] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", postId).eq("status", "published").maybeSingle(),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false }),
  ]);

  if (postResult.error) {
    throw new Error("Could not load blog post.");
  }

  if (!postResult.data) {
    notFound();
  }

  if (commentsResult.error) {
    throw new Error("Could not load blog engagement.");
  }

  return {
    post: postResult.data as BlogPost,
    comments: (commentsResult.data ?? []) as BlogComment[],
  };
}

export async function getProjects(
  options: { featuredOnly?: boolean; limit?: number } = {},
): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*")
    .eq("visibility", "public")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.featuredOnly) {
    query = query.eq("featured", true);
  }

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Could not load projects.");
  }

  return (data ?? []) as Project[];
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .maybeSingle();

  if (error) {
    throw new Error("Could not load project.");
  }

  if (!data) {
    notFound();
  }

  return data as Project;
}
