"use client";

import { contactSchema, type ContactActionState } from "@/lib/contact/schema";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

export async function sendInquiry(formData: FormData, requestId: string, measurement: { allowed: boolean; source: string | null }): Promise<ContactActionState> {
  const values = Object.fromEntries(["full_name", "email", "subject", "message", "budget", "timeline"].map((name) => [name, formData.get(name) ?? ""]));
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const errors: ContactActionState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof errors;
      (errors[field] ??= []).push(issue.message);
    }
    return { status: "error", message: "Check the highlighted fields and try again.", errors };
  }
  try {
    // Session presence only excludes signed-in visitors from optional metrics.
    // Public inquiry submission does not use it for identity or authorization.
    const { data, error } = await createClient().auth.getSession();
    const measure = measurement.allowed && !error && !data.session;
    const key = getSupabasePublishableKey();
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/site-inquiries`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ ...parsed.data, request_id: requestId, website_url: formData.get("website_url") ?? "", source_path: measure ? measurement.source : null, measurement_allowed: measure }),
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json();
    if (result && ["success", "error"].includes(result.status) && typeof result.message === "string") return { status: result.status, message: result.message.slice(0,500) };
  } catch { /* Keep all controlled input values when the network fails. */ }
  return { status: "error", message: "Your note couldn’t be sent. Your details are still here—please try again shortly." };
}
