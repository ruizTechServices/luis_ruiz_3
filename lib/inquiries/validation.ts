import { z } from "zod";

import { INQUIRY_STATUSES, type InquiryView } from "@/lib/inquiries/types";

export const inquiryUpdateSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  status: z.enum(INQUIRY_STATUSES),
  followUpAt: z.iso.datetime({ offset: true }).nullable(),
  internalNotes: z.string().trim().max(10_000, "Keep private notes under 10,000 characters."),
}).strict();

export function parseInquiryView(value: string | string[] | undefined): InquiryView {
  if (value === "active" || value === "due" || value === "all") return value;
  return INQUIRY_STATUSES.find((status) => status === value) ?? "active";
}

export function parsePositiveInteger(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9]\d{0,15}$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function inquiryReplyHref(email: string | null, subject: string | null): string | null {
  if (!email || !z.email().safeParse(email).success) return null;
  const subjectLine = (subject || "Your project inquiry").replace(/[\r\n]/g, " ");
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subjectLine}`)}`;
}
