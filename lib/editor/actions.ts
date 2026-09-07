"use server";

import { revalidatePath } from "next/cache";

import { requireGioAdmin } from "@/lib/auth/admin";
import type { EditorStory, StoryInput, StoryResult } from "@/lib/editor/types";
import { storyInputSchema } from "@/lib/editor/validation";
import { serverLog } from "@/lib/logging/server";
import { createClient } from "@/lib/supabase/server";

export async function saveStory(input: StoryInput): Promise<StoryResult> {
  await requireGioAdmin();
  const parsed = storyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your story and try again." };
  }

  const { id, expectedUpdatedAt, ...fields } = parsed.data;
  const supabase = await createClient();
  const payload = {
    ...fields,
    summary: fields.summary || null,
    tags: fields.tags || null,
    references: fields.references || null,
  };

  // Matching the last saved timestamp prevents an older tab from silently overwriting a newer edit.
  const query = id === null
    ? supabase.from("blog_posts").insert(payload)
    : supabase.from("blog_posts").update(payload).eq("id", id).eq("updated_at", expectedUpdatedAt!);
  const { data, error } = await query
    .select("id, title, summary, body, tags, references, status, created_at, updated_at, published_at")
    .maybeSingle();

  if (error) {
    serverLog({ scope: "editor", level: "error", event: "story_save_failed", metadata: { storyId: id, code: error.code } });
    return { ok: false, message: "Your story was not saved. Keep this tab open and try again." };
  }
  if (!data) {
    return { ok: false, message: "This story changed in another tab. Copy your unsaved writing, then reload before saving again." };
  }

  const story = data as EditorStory;
  for (const path of ["/", "/blog", `/blog/${story.id}`, "/dashboard", "/dashboard/write", "/admin/blog-posts", "/sitemap", "/sitemap.xml", "/feed.xml"]) {
    revalidatePath(path);
  }
  revalidatePath(`/dashboard/write/${story.id}`);

  return {
    ok: true,
    story,
    message: story.status === "published" ? "Published. Your story is live on your site." : "Draft saved. Only you can read it.",
  };
}
