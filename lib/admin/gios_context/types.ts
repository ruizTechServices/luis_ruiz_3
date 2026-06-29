import { z } from "zod";

export interface GiosContextRow {
  id: number;
  created_at: string;
  session_id: number | null;
  message_id: number | null;
  role: string;
  model: string | null;
  source: string | null;
  content: string;
  user_id: string | null;
}

export const giosContextInputSchema = z.object({
  session_id: z.number().int().finite().nullable(),
  message_id: z.number().int().finite().nullable(),
  role: z.string().min(1, "Role is required."),
  model: z.string().nullable(),
  source: z.string().nullable(),
  content: z.string().min(1, "Content is required."),
});

export type GiosContextInput = z.infer<typeof giosContextInputSchema>;

