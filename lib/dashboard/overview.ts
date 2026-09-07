import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface RecentInquiry {
  id: number;
  full_name: string | null;
  subject: string | null;
  created_at: string;
}

export interface GioOverview {
  stories: number | null;
  publicProjects: number | null;
  inquiries: number | null;
  openTasks: number | null;
  recentInquiries: RecentInquiry[] | null;
}

export async function getGioOverview(): Promise<GioOverview> {
  await requireGioAdmin();
  const supabase = await createClient();
  const [stories, projects, inquiries, tasks] = await Promise.all([
    supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("visibility", "public"),
    supabase.from("contactlist").select("id, full_name, subject, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(3),
    supabase.from("todos").select("id", { count: "exact", head: true }).eq("is_completed", false),
  ]);

  // Failed reads are unavailable, never fabricated zero counts.
  return {
    stories: stories.error ? null : stories.count,
    publicProjects: projects.error ? null : projects.count,
    inquiries: inquiries.error ? null : inquiries.count,
    openTasks: tasks.error ? null : tasks.count,
    recentInquiries: inquiries.error ? null : (inquiries.data ?? []) as RecentInquiry[],
  };
}

export async function getOwnerNextActions(user: AuthenticatedUser) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dashboard_projects")
    .select("id, name, next_action")
    .eq("user_id", user.id)
    .not("next_action", "is", null)
    .neq("next_action", "")
    .order("updated_at", { ascending: false })
    .limit(3);

  if (error) return null;
  return (data ?? []) as { id: string; name: string; next_action: string }[];
}
