export const INQUIRY_STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam"] as const;
export const ACTIVE_INQUIRY_STATUSES = ["new", "contacted", "qualified"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export type InquiryView = InquiryStatus | "active" | "due" | "all";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
  spam: "Spam",
};

export interface InquirySummary {
  id: number;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  subject: string | null;
  company: string | null;
  status: InquiryStatus;
  follow_up_at: string | null;
}

export interface Inquiry extends InquirySummary {
  email: string | null;
  phone: string | null;
  budget: string | null;
  timeline: string | null;
  preferred_contact: string | null;
  message: string | null;
  internal_notes: string;
  source_path: string | null;
  source_project: string | null;
}

export interface InquiryUpdateInput {
  id: number;
  expectedUpdatedAt: string;
  status: InquiryStatus;
  followUpAt: string | null;
  internalNotes: string;
}

export type InquiryUpdateResult =
  | { ok: true; inquiry: Inquiry; message: string }
  | { ok: false; message: string };

export const INQUIRY_PAGE_SIZE = 20;

export function isActiveInquiry(status: InquiryStatus): boolean {
  return ACTIVE_INQUIRY_STATUSES.some((active) => active === status);
}

export function isInquiryDue(inquiry: Pick<InquirySummary, "status" | "follow_up_at">, now: number): boolean {
  return isActiveInquiry(inquiry.status) && inquiry.follow_up_at !== null && Date.parse(inquiry.follow_up_at) <= now;
}
