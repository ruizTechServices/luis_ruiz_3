export type StoryStatus = "draft" | "published";

export interface StorySummary {
  id: number;
  title: string | null;
  summary: string | null;
  tags: string | null;
  status: StoryStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface EditorStory extends StorySummary {
  body: string | null;
  references: string | null;
}

export interface StoryInput {
  id: number | null;
  expectedUpdatedAt: string | null;
  title: string;
  summary: string;
  body: string;
  tags: string;
  references: string;
  status: StoryStatus;
}

export type StoryResult =
  | { ok: true; story: EditorStory; message: string }
  | { ok: false; message: string };
