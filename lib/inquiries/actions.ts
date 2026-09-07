"use server";

import { revalidatePath } from "next/cache";

import { requireGioAdmin } from "@/lib/auth/admin";
import { INQUIRY_SELECT } from "@/lib/inquiries/data";
import type { Inquiry, InquiryUpdateInput, InquiryUpdateResult } from "@/lib/inquiries/types";
import { inquiryUpdateSchema } from "@/lib/inquiries/validation";
import { serverLog } from "@/lib/logging/server";
import { createClient } from "@/lib/supabase/server";

export async function updateInquiry(input: InquiryUpdateInput): Promise<InquiryUpdateResult> {
  await requireGioAdmin();
  const parsed = inquiryUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the follow-up details and try again." };

  const { id, expectedUpdatedAt, status, followUpAt, internalNotes } = parsed.data;
  const supabase = await createClient();
  // Submitted identity and message are deliberately absent from the update payload.
  const { data, error } = await supabase.from("contactlist")
    .update({ status, follow_up_at: followUpAt, internal_notes: internalNotes })
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select(INQUIRY_SELECT)
    .maybeSingle();

  if (error) {
    serverLog({ scope: "inquiries", level: "error", event: "inquiry_update_failed", metadata: { inquiryId: id, code: error.code } });
    return { ok: false, message: "Your changes were not saved. Keep this page open and try again." };
  }
  if (!data) return { ok: false, message: "This inquiry changed in another tab or is no longer available. Copy your notes, then reload before saving." };

  for (const path of ["/dashboard", "/dashboard/inquiries", "/admin", "/admin/contactlist"]) revalidatePath(path);
  return { ok: true, inquiry: data as Inquiry, message: "Inquiry updated." };
}
