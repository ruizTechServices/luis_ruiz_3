import { z } from "zod";

export interface JournalRow {
  id: number;
  created_at: string;
  updated_at: string | null;
  title: string | null;
  content: string | null;
  tags: string | null;
}

export const journalInputSchema = z.object({
  title: z.string().nullable(),
  content: z.string().nullable(),
  tags: z.string().nullable(),
});

export type JournalInput = z.infer<typeof journalInputSchema>;

