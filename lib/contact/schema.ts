import { z } from "zod";

import { CONTACT_TOPICS } from "@/lib/contact/topics";

export const contactSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name.").max(120, "Keep your name under 120 characters."),
  email: z.string().trim().max(254, "Use a shorter email address.").email("Enter a valid email address.").toLowerCase(),
  subject: z.enum(CONTACT_TOPICS, { error: "Choose what you need help with." }),
  message: z.string().trim().min(10, "Add a little more detail (at least 10 characters).").max(5000, "Keep your message under 5,000 characters."),
  budget: z.string().trim().max(120, "Keep your budget under 120 characters."),
  timeline: z.string().trim().max(120, "Keep your timeline under 120 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

export interface ContactActionState {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<ContactField, string[]>>;
}
