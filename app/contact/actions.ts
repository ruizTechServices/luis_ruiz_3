"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { saveContactInquiry } from "@/lib/contact/mutations";
import { contactSchema, type ContactActionState } from "@/lib/contact/schema";

const successState: ContactActionState = {
  status: "success",
  message: "Your project note is in my inbox. I’ll review the details and follow up by email about the next step.",
};

export async function submitContact(
  _state: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  // Bots that fill the offscreen field receive the same response without a write.
  if (formData.get("website_url")) {
    return successState;
  }

  const parsed = contactSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    budget: formData.get("budget") ?? "",
    timeline: formData.get("timeline") ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields and try again.", errors: z.flattenError(parsed.error).fieldErrors };
  }

  if (!(await saveContactInquiry(parsed.data))) {
    return { status: "error", message: "Your note couldn’t be saved. Your details are still here — please try again shortly." };
  }

  revalidatePath("/admin/contactlist");
  revalidatePath("/dashboard");
  return successState;
}
