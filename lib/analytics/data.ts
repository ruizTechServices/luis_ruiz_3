import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const count = z.number().int().nonnegative();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const pathRow = z.object({ page_path: z.string().max(112), views: count, inquiries: count });
const summarySchema = z.object({
  days: z.number().int(), since: date, through: date, first_day: date.nullable(),
  page_views: count, project_views: count, inquiries: count,
  soundboard_views: count, sound_plays: count, soundboard_returns: count,
  top_pages: z.array(pathRow).max(20), top_projects: z.array(pathRow).max(20), inquiry_sources: z.array(pathRow).max(20),
  daily: z.array(z.object({ metric_day: date, views: count, inquiries: count })).max(90),
});

export type SiteInsights = z.infer<typeof summarySchema>;
export type InsightPathRow = z.infer<typeof pathRow>;

export async function getSiteInsights(days: 7 | 30 | 90): Promise<SiteInsights | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("site_metrics_summary", { p_days: days });
    if (error) return null;
    const parsed = summarySchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}
