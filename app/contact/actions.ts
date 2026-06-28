"use server";

import { revalidatePath } from "next/cache";

import { readBoolean, readOptionalString, readString, type ActionState } from "@/lib/data/form";
import { createClient } from "@/lib/supabase/server";

export async function submitContact(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = readString(formData, "full_name");
  const email = readString(formData, "email");
  const message = readString(formData, "message");

  if (!fullName || !email || !message) {
    return { message: "Name, email, and message are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contactlist").insert({
    full_name: fullName,
    email,
    message,
    phone: readOptionalString(formData, "phone"),
    company: readOptionalString(formData, "company"),
    subject: readOptionalString(formData, "subject"),
    budget: readOptionalString(formData, "budget"),
    timeline: readOptionalString(formData, "timeline"),
    preferred_contact: readOptionalString(formData, "preferred_contact"),
    newsletter: readBoolean(formData, "newsletter"),
  });

  if (error) {
    return { message: "Could not submit the contact request." };
  }

  revalidatePath("/contact");

  return { message: "Submitted." };
}
