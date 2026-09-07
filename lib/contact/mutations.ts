import "server-only";

import type { ContactInput } from "@/lib/contact/schema";
import { serverLog } from "@/lib/logging/server";
import { createClient } from "@/lib/supabase/server";

export async function saveContactInquiry(input: ContactInput): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contactlist").insert({
      ...input,
      budget: input.budget || null,
      timeline: input.timeline || null,
      preferred_contact: "email",
      newsletter: false,
    });

    if (error) {
      serverLog({ scope: "contact", event: "inquiry_save_failed", level: "error", metadata: { code: error.code } });
      return false;
    }

    return true;
  } catch {
    // Contact details and raw database errors must never reach the logs.
    serverLog({ scope: "contact", event: "inquiry_save_unavailable", level: "error" });
    return false;
  }
}
