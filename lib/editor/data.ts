import "server-only";

import { notFound } from "next/navigation";

import { requireGioAdmin } from "@/lib/auth/admin";
import type { EditorStory, StorySummary } from "@/lib/editor/types";
import { createClient } from "@/lib/supabase/server";

export async function getStories(): Promise<StorySummary[]> {
  await requireGioAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, summary, tags, status, created_at, updated_at, published_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Your stories could not be loaded. Please try again.");
  return (data ?? []) as StorySummary[];
}

export async function getEditorStory(id: string): Promise<EditorStory> {
  await requireGioAdmin();
  const storyId = Number(id);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(storyId)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, summary, body, tags, references, status, created_at, updated_at, published_at")
    .eq("id", storyId)
    .maybeSingle();

  if (error) throw new Error("This story could not be loaded. Please try again.");
  if (!data) notFound();
  return data as EditorStory;
}
