import { z } from "zod";

export interface TodoRow {
  id: number;
  description: string;
  is_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  position: number | null;
}

export const todoInputSchema = z.object({
  description: z.string().min(1, "Description is required."),
  is_completed: z.boolean(),
  position: z.number().int().finite(),
});

export type TodoInput = z.infer<typeof todoInputSchema>;

