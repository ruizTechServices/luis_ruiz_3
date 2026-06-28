"use client";

import { useActionState } from "react";

import { submitContact } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";

const initialState = { message: undefined };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="full_name" required />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="email" required type="email" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Phone</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="phone" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Company</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="company" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Subject</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="subject" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Message</span>
        <textarea className="min-h-32 rounded-md border border-input bg-background px-3 py-2" name="message" required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Budget</span>
          <input className="rounded-md border border-input bg-background px-3 py-2" name="budget" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Timeline</span>
          <input className="rounded-md border border-input bg-background px-3 py-2" name="timeline" />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Preferred contact</span>
        <input className="rounded-md border border-input bg-background px-3 py-2" name="preferred_contact" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="newsletter" type="checkbox" />
        Send occasional updates
      </label>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
      <Button disabled={pending} type="submit">
        {pending ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
