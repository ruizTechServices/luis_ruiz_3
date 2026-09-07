import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { ACTIVE_INQUIRY_STATUSES, INQUIRY_PAGE_SIZE, type Inquiry, type InquirySummary, type InquiryView } from "@/lib/inquiries/types";
import { createClient } from "@/lib/supabase/server";

export const INQUIRY_SELECT = "id, created_at, updated_at, full_name, email, phone, company, subject, budget, timeline, preferred_contact, message, status, follow_up_at, internal_notes, source_path, source_project";
const SUMMARY_SELECT = "id, created_at, updated_at, full_name, subject, company, status, follow_up_at";

export interface InquiryInbox {
  asOf: string;
  items: InquirySummary[] | null;
  count: number | null;
  selected: Inquiry | null;
  selectedUnavailable: boolean;
  newCount: number | null;
  activeCount: number | null;
  dueCount: number | null;
}

export async function getInquiryInbox(view: InquiryView, page: number, selectedId: number | null): Promise<InquiryInbox> {
  await requireGioAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const start = (page - 1) * INQUIRY_PAGE_SIZE;
  let query = supabase.from("contactlist").select(SUMMARY_SELECT, { count: "exact" });
  if (view === "active" || view === "due") query = query.in("status", [...ACTIVE_INQUIRY_STATUSES]);
  if (view === "due") query = query.lte("follow_up_at", now);
  if (view !== "all" && view !== "active" && view !== "due") query = query.eq("status", view);
  if (view === "active" || view === "due") query = query.order("follow_up_at", { ascending: true, nullsFirst: false });
  query = query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(start, start + INQUIRY_PAGE_SIZE - 1);

  const [inquiries, newInquiries, activeInquiries, dueInquiries, requested] = await Promise.all([
    query,
    supabase.from("contactlist").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contactlist").select("id", { count: "exact", head: true }).in("status", [...ACTIVE_INQUIRY_STATUSES]),
    supabase.from("contactlist").select("id", { count: "exact", head: true }).in("status", [...ACTIVE_INQUIRY_STATUSES]).lte("follow_up_at", now),
    selectedId ? supabase.from("contactlist").select(INQUIRY_SELECT).eq("id", selectedId).maybeSingle() : Promise.resolve(null),
  ]);

  const items = inquiries.error ? null : (inquiries.data ?? []) as InquirySummary[];
  const first = !selectedId && items?.[0]
    ? await supabase.from("contactlist").select(INQUIRY_SELECT).eq("id", items[0].id).maybeSingle()
    : null;
  const selected = requested ?? first;

  return {
    asOf: now,
    items,
    count: inquiries.error ? null : inquiries.count,
    selected: selected?.error ? null : (selected?.data ?? null) as Inquiry | null,
    selectedUnavailable: Boolean(selected?.error) || Boolean(selectedId && !requested?.data),
    newCount: newInquiries.error ? null : newInquiries.count,
    activeCount: activeInquiries.error ? null : activeInquiries.count,
    dueCount: dueInquiries.error ? null : dueInquiries.count,
  };
}
