import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface BlogPost {
  id: number;
  created_at: string;
  title: string | null;
  summary: string | null;
  tags: string | null;
  references: string | null;
  body: string | null;
}

export interface BlogPostWithStats extends BlogPost {
  comment_count: number;
  up_votes: number;
  down_votes: number;
}

export interface BlogComment {
  id: number;
  post_id: number;
  user_email: string | null;
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
    getProjects({ featuredOnly: true, limit: 3 }),
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

export async function getBlogPosts(options: { limit?: number } = {}): Promise<BlogPostWithStats[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_blog_posts_with_stats");

  if (error) {
    throw new Error("Could not load blog posts.");
  }

  const posts = (data ?? []) as BlogPostWithStats[];

  return typeof options.limit === "number" ? posts.slice(0, options.limit) : posts;
}

export async function getBlogPost(id: string): Promise<{
  post: BlogPost;
  comments: BlogComment[];
  upVotes: number;
  downVotes: number;
}> {
  const supabase = await createClient();
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId < 1) {
    notFound();
  }

  const [postResult, commentsResult, votesResult] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", postId).maybeSingle(),
    supabase
      .from("comments")
      .select("id, post_id, user_email, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false }),
    supabase.from("votes").select("vote_type").eq("post_id", postId),
  ]);

  if (postResult.error) {
    throw new Error("Could not load blog post.");
  }

  if (!postResult.data) {
    notFound();
  }

  if (commentsResult.error || votesResult.error) {
    throw new Error("Could not load blog engagement.");
  }

  const votes = (votesResult.data ?? []) as { vote_type: string | null }[];

  return {
    post: postResult.data as BlogPost,
    comments: (commentsResult.data ?? []) as BlogComment[],
    upVotes: votes.filter((vote) => vote.vote_type === "up").length,
    downVotes: votes.filter((vote) => vote.vote_type === "down").length,
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
