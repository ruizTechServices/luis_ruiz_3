import { z } from "zod";

const optionalText = (limit: number) => z.string().trim().max(limit).nullable();
const httpUrl = z.string().trim().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a complete HTTP or HTTPS URL without embedded credentials.");
const projectDate = z.union([z.iso.date(), z.iso.datetime({ offset: true })])
  .nullable()
  .transform((value) => value?.length === 10 ? `${value}T00:00:00Z` : value);

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, "Add a project title.").max(240),
  slug: z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores for the page slug."),
  url: httpUrl,
  summary: optionalText(1000),
  description: optionalText(10000),
  status: z.enum(["draft", "active", "complete", "archived"]),
  category: z.enum(["project", "product", "client", "experiment"]),
  visibility: z.enum(["public", "unlisted", "private"]),
  featured: z.boolean(),
  stack: z.string().max(4000).nullable()
    .transform((value) => [...new Set((value ?? "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(100)).max(30, "List no more than 30 technologies.")),
  role: optionalText(1000),
  context: optionalText(20000),
  problem: optionalText(20000),
  constraints: optionalText(20000),
  approach: optionalText(20000),
  architecture: optionalText(20000),
  decisions: optionalText(20000),
  outcomes: optionalText(20000),
  current_status: optionalText(5000),
  repo_url: httpUrl.nullable(),
  live_url: httpUrl.nullable(),
  cover_image_url: httpUrl.nullable(),
  started_at: projectDate,
  completed_at: projectDate,
}).superRefine((project, context) => {
  if (project.started_at && project.completed_at && Date.parse(project.completed_at) < Date.parse(project.started_at)) {
    context.addIssue({ code: "custom", path: ["completed_at"], message: "Completion cannot be before the project start date." });
  }
});
