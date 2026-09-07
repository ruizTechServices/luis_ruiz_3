"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useActionState, useRef, useState, type ChangeEvent } from "react";

import { sendInquiry } from "@/lib/contact/submit";
import { getInquirySource, measurementIsAllowed } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";
import type { ContactActionState, ContactField, ContactInput } from "@/lib/contact/schema";
import { CONTACT_TOPICS } from "@/lib/contact/topics";

const initialState: ContactActionState = { status: "idle" };
const inputClass = "w-full rounded-lg border border-input bg-background px-3.5 py-3 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:border-destructive";

export function ContactForm({ initialTopic = "Not sure yet", initialMessage = "" }: { initialTopic?: ContactInput["subject"]; initialMessage?: string }) {
  const [attempt, setAttempt] = useState(0);
  return <ContactRequestForm initialTopic={initialTopic} initialMessage={initialMessage} key={attempt} onNewInquiry={() => setAttempt((current) => current + 1)} />;
}

function ContactRequestForm({ onNewInquiry, initialTopic, initialMessage }: { onNewInquiry: () => void; initialTopic: ContactInput["subject"]; initialMessage: string }) {
  const requestId = useRef<string | null>(null);
  const [state, action, pending] = useActionState(async (_state: ContactActionState, formData: FormData) => {
    requestId.current ??= crypto.randomUUID();
    return sendInquiry(formData, requestId.current, { allowed: measurementIsAllowed(), source: getInquirySource() });
  }, initialState);
  // Controlled values survive validation and network failures without losing the note.
  const [values, setValues] = useState<ContactInput>({
    full_name: "", email: "", subject: initialTopic, message: initialMessage, budget: "", timeline: "",
  });

  function fieldProps(name: ContactField) {
    return {
      id: `contact-${name}`,
      name,
      value: values[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        requestId.current = null;
        setValues((current) => ({ ...current, [name]: event.target.value }));
      },
      "aria-invalid": Boolean(state.errors?.[name]),
      "aria-describedby": state.errors?.[name] ? `contact-${name}-error` : undefined,
      className: inputClass,
    };
  }

  function fieldError(name: ContactField) {
    const error = state.errors?.[name]?.[0];
    return error ? <span className="text-sm text-destructive" id={`contact-${name}-error`}>{error}</span> : null;
  }

  if (state.status === "success") {
    return (
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-8 sm:p-10" role="status" aria-live="polite">
        <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check aria-hidden="true" className="size-6" /></span>
        <h2 className="font-display text-3xl">Message received.</h2>
        <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{state.message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link href="/projects">Explore my work <ArrowRight aria-hidden="true" /></Link></Button>
          <Button onClick={onNewInquiry} variant="outline">Send another note</Button>
        </div>
      </section>
    );
  }

  return (
    <form action={action} aria-busy={pending} className="relative grid gap-6 rounded-xl border border-border bg-card p-6 sm:p-9">
      <div>
        <h2 className="font-display text-2xl">Start with a project note.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A few details are enough to start. No account needed.</p>
      </div>
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
        <label htmlFor="contact-website-url">Leave this field empty</label>
        <input autoComplete="off" id="contact-website-url" name="website_url" tabIndex={-1} type="text" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid content-start gap-2 text-sm" htmlFor="contact-full_name">
          <span className="font-medium">Your name</span>
          <input {...fieldProps("full_name")} autoComplete="name" maxLength={120} required />
          {fieldError("full_name")}
        </label>
        <label className="grid content-start gap-2 text-sm" htmlFor="contact-email">
          <span className="font-medium">Email address</span>
          <input {...fieldProps("email")} autoComplete="email" maxLength={254} required type="email" />
          {fieldError("email")}
        </label>
      </div>
      <label className="grid gap-2 text-sm" htmlFor="contact-subject">
        <span className="font-medium">What can I help with?</span>
        <select {...fieldProps("subject")} required>{CONTACT_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select>
        {fieldError("subject")}
      </label>
      <label className="grid gap-2 text-sm" htmlFor="contact-message">
        <span className="font-medium">Tell me about it</span>
        <textarea {...fieldProps("message")} className={`${inputClass} min-h-40 resize-y`} maxLength={5000} minLength={10} placeholder="What are you building or trying to fix? Include a website link if you have one, and what a good result would look like." required rows={6} />
        {fieldError("message")}
        <span className="text-xs text-muted-foreground">Please leave out passwords, access keys, and other sensitive information.</span>
      </label>
      <details className="rounded-lg border border-border px-4 py-3" open={Boolean(state.errors?.budget || state.errors?.timeline) || undefined}>
        <summary className="cursor-pointer text-sm font-medium marker:text-primary">Budget &amp; timeline <span className="font-normal text-muted-foreground">(optional)</span></summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm" htmlFor="contact-budget">
            <span>Budget range</span>
            <input {...fieldProps("budget")} maxLength={120} placeholder="A range, or still exploring" />
            {fieldError("budget")}
          </label>
          <label className="grid gap-2 text-sm" htmlFor="contact-timeline">
            <span>Ideal timeline</span>
            <input {...fieldProps("timeline")} maxLength={120} placeholder="A target date, or flexible" />
            {fieldError("timeline")}
          </label>
        </div>
      </details>
      {state.status === "error" ? <p className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{state.message}</p> : null}
      <div className="grid gap-3">
        <Button className="h-12 w-full text-sm" disabled={pending} type="submit">{pending ? "Sending your note…" : "Send project inquiry"}<ArrowRight aria-hidden="true" className="size-4" /></Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">Sent privately to Gio. I’ll use your email to reply to this inquiry. <Link href="/privacy" className="underline underline-offset-4">Privacy &amp; measurement</Link></p>
      </div>
    </form>
  );
}
