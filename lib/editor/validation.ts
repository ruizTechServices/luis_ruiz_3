import { z } from "zod";

export const storyInputSchema = z
  .object({
    id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }).nullable(),
    title: z.string().trim().min(1, "Give your story a title before saving.").max(240, "Keep the title under 240 characters."),
    summary: z.string().trim().max(500, "Keep the subtitle under 500 characters."),
    body: z.string().max(100_000, "Keep the story under 100,000 characters."),
    tags: z.string().trim().max(500, "Keep tags under 500 characters."),
    references: z.string().trim().max(10_000, "Keep sources under 10,000 characters."),
    status: z.enum(["draft", "published"]),
  })
  .superRefine((story, context) => {
    if (story.status === "published" && !story.body.trim()) {
      context.addIssue({ code: "custom", path: ["body"], message: "Write your story before publishing." });
    }
    if (story.id !== null && !story.expectedUpdatedAt) {
      context.addIssue({ code: "custom", path: ["expectedUpdatedAt"], message: "Reload this story before saving." });
    }
    if (story.tags.split(",").filter((tag) => tag.trim()).length > 8) {
      context.addIssue({ code: "custom", path: ["tags"], message: "Choose up to eight tags, separated by commas." });
    }
  });
