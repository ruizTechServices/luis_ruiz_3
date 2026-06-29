import { z } from "zod";

export interface DocumentRow {
  id: number;
  created_at: string;
  updated_at: string | null;
  title: string | null;
  content: string | null;
  source: string | null;
  url: string | null;
}

export const documentInputSchema = z.object({
  title: z.string().nullable(),
  content: z.string().nullable(),
  source: z.string().nullable(),
  url: z.string().url("URL must be valid.").nullable(),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

