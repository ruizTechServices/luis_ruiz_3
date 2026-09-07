import type { Metadata } from "next";

import { StoryEditor } from "@/components/editor/story-editor";
import { requireGioAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Write a story", robots: { index: false, follow: false } };

export default async function NewStoryPage() {
  const owner = await requireGioAdmin();
  return <StoryEditor key={`${owner.id}:new`} ownerId={owner.id} initialStory={null} />;
}
