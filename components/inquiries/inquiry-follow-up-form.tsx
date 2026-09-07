"use client";

import { useState, useTransition, type FormEvent } from "react";

import { LocalDateTimeField } from "@/components/data/local-date-time-field";
import { Button } from "@/components/ui/button";
import { updateInquiry } from "@/lib/inquiries/actions";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, type Inquiry, type InquiryStatus } from "@/lib/inquiries/types";

type FollowUpFields = Pick<Inquiry, "id" | "updated_at" | "status" | "follow_up_at" | "internal_notes">;

export function InquiryFollowUpForm({ inquiry }: { inquiry: FollowUpFields }) {
  const [saved, setSaved] = useState(inquiry);
  const [status, setStatus] = useState(inquiry.status);
  const [notes, setNotes] = useState(inquiry.internal_notes ?? "");
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const followUpAt = String(formData.get("followUpAt") ?? "");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await updateInquiry({
          id: saved.id,
          expectedUpdatedAt: saved.updated_at,
          status,
          followUpAt: followUpAt || null,
          internalNotes: notes,
        });
        setMessage(result.message);
        setFailed(!result.ok);
        if (result.ok) {
          setSaved(result.inquiry);
          setStatus(result.inquiry.status);
          setNotes(result.inquiry.internal_notes ?? "");
          setDirty(false);
        }
      } catch {
        setFailed(true);
        setMessage("Your changes were not saved. Keep this tab open, check your connection and sign-in, then try again.");
      }
    });
  }

  return (
    <form onSubmit={submit} onChange={() => { setDirty(true); setMessage(""); }} className="border-t border-border pt-6">
      <fieldset disabled={pending} className="grid gap-5 disabled:opacity-70">
        <legend className="mb-5 font-display text-xl">Plan the next step</legend>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as InquiryStatus)} className="min-h-11 rounded-md border border-input bg-background px-3 py-2">
            {INQUIRY_STATUSES.map((value) => <option key={value} value={value}>{INQUIRY_STATUS_LABELS[value]}</option>)}
          </select>
          <span className="text-xs leading-5 text-muted-foreground">New → Contacted → Qualified → Won. Lost and Spam close the conversation.</span>
        </label>
        <LocalDateTimeField name="followUpAt" label="Next follow-up" value={saved.follow_up_at ?? ""} hint="Clear the date when no follow-up is planned." />
        {status === "won" || status === "lost" || status === "spam" ? <p className="text-xs leading-5 text-muted-foreground">Closed inquiries stay in their status filter. Their dates do not appear in the follow-up queue.</p> : null}
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Private notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={6} maxLength={10_000} placeholder="What did you discuss? What should happen next?" className="w-full rounded-md border border-input bg-background px-3 py-2 leading-relaxed" />
          <span className="text-xs text-muted-foreground">Only you can read these notes.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">{pending ? "Saving…" : "Save follow-up"}</Button>
          {dirty ? <span className="text-xs text-muted-foreground">Unsaved changes</span> : null}
        </div>
      </fieldset>
      <p aria-live="polite" role={failed ? "alert" : "status"} className={`mt-3 text-sm ${failed ? "text-destructive" : "text-primary"}`}>{message}</p>
    </form>
  );
}
