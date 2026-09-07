import type { Metadata } from "next";

import { StoryEditor } from "@/components/editor/story-editor";
import { requireGioAdmin } from "@/lib/auth/admin";
import { getEditorStory } from "@/lib/editor/data";

export const metadata: Metadata = { title: "Edit your story", robots: { index: false, follow: false } };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [owner, story] = await Promise.all([requireGioAdmin(), getEditorStory(id)]);
  return <StoryEditor key={`${owner.id}:${id}`} ownerId={owner.id} initialStory={story} />;
}
