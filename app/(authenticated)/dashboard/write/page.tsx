import type { Metadata } from "next";

import { StoryLibrary } from "@/components/editor/story-library";
import { getStories } from "@/lib/editor/data";

export const metadata: Metadata = { title: "Your stories", robots: { index: false, follow: false } };

export default async function StoriesPage() {
  return <StoryLibrary stories={await getStories()} />;
}
