import type { Metadata } from "next";

import { StoryEditor } from "@/components/editor/story-editor";
import { getEditorStory } from "@/lib/editor/data";

export const metadata: Metadata = { title: "Edit your story", robots: { index: false, follow: false } };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryEditor key={id} initialStory={await getEditorStory(id)} />;
}
