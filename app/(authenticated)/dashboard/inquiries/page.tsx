import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { EmailAlertStatus } from "@/components/inquiries/email-alert-status";
import { InquiryFollowUpForm } from "@/components/inquiries/inquiry-follow-up-form";
import { InquiryTime } from "@/components/inquiries/inquiry-time";
import { Button } from "@/components/ui/button";
import { requireGioAdmin } from "@/lib/auth/admin";
import { getInquiryInbox } from "@/lib/inquiries/data";
import { INQUIRY_PAGE_SIZE, INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, isInquiryDue, type InquiryView } from "@/lib/inquiries/types";
import { inquiryReplyHref, parseInquiryView, parsePositiveInteger } from "@/lib/inquiries/validation";

export const metadata: Metadata = { title: "Inquiries | Your workspace", robots: { index: false, follow: false } };

const views: { value: InquiryView; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "due", label: "Follow-ups due" },
  ...INQUIRY_STATUSES.map((value) => ({ value, label: INQUIRY_STATUS_LABELS[value] })),
  { value: "all", label: "All" },
];

function inboxHref(view: InquiryView, page = 1, id?: number) {
  const params = new URLSearchParams({ view });
  if (page > 1) params.set("page", String(page));
  if (id) params.set("id", String(id));
  return `/dashboard/inquiries?${params.toString()}${id ? "#inquiry-detail" : ""}`;
}

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireGioAdmin();
  const params = await searchParams;
  const view = parseInquiryView(params.view);
  const page = Math.min(parsePositiveInteger(params.page) ?? 1, 50_000);
  const selectedId = parsePositiveInteger(params.id);
  const inbox = await getInquiryInbox(view, page, selectedId);
  const selected = inbox.selected;
  const replyHref = selected ? inquiryReplyHref(selected.email, selected.subject) : null;
  const now = Date.parse(inbox.asOf);

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
      <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/dashboard"><ArrowLeft aria-hidden="true" className="size-4" />Dashboard</Link>
      <header className="mt-5">
        <p className="eyebrow">Your client conversations</p>
        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Inquiries</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">Read what someone needs, record your next step, and keep the conversation moving.</p>
      </header>

      <section aria-label="Inquiry counts" className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "New inquiries", value: inbox.newCount, filter: "new" as const },
          { label: "Active conversations", value: inbox.activeCount, filter: "active" as const },
          { label: "Follow-ups due", value: inbox.dueCount, filter: "due" as const },
        ].map((metric) => <Link className="rounded-xl border border-border bg-card p-5 hover:border-primary/40" href={inboxHref(metric.filter)} key={metric.label}><span className="text-sm text-muted-foreground">{metric.label}</span><span className="mt-2 block font-display text-3xl">{metric.value ?? <span className="font-sans text-sm">Unavailable</span>}</span></Link>)}
      </section>

      <div className="mt-6"><EmailAlertStatus /></div>

      <nav aria-label="Filter inquiries" className="my-7 flex flex-wrap gap-2">
        {views.map((option) => <Link key={option.value} aria-current={view === option.value ? "page" : undefined} href={inboxHref(option.value)} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition ${view === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>{option.label}</Link>)}
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <section aria-labelledby="queue-heading" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border p-5"><h2 id="queue-heading" className="font-display text-xl">{views.find((option) => option.value === view)?.label}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{inbox.count === null ? "Count unavailable" : `${inbox.count} ${inbox.count === 1 ? "inquiry" : "inquiries"}`}{view === "active" || view === "due" ? " · Scheduled follow-ups first" : " · Newest first"}</p></div>
          {inbox.items === null ? <p role="alert" className="p-5 text-sm leading-relaxed text-destructive">The inbox couldn’t be loaded. Refresh this page to try again.</p> : inbox.items.length ? (
            <ul className="divide-y divide-border">
              {inbox.items.map((inquiry) => <li key={inquiry.id}><Link href={inboxHref(view, page, inquiry.id)} aria-current={selected?.id === inquiry.id ? "true" : undefined} className={`block p-5 transition hover:bg-primary/[0.04] ${selected?.id === inquiry.id ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/25" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="break-words text-sm font-semibold">{inquiry.full_name || "Project inquiry"}</span><span className="rounded-full border border-border px-2 py-1 text-xs">{INQUIRY_STATUS_LABELS[inquiry.status]}</span></div>
                <p className="mt-2 break-words text-sm text-muted-foreground">{inquiry.subject || "A project conversation"}</p>
                {inquiry.company ? <p className="mt-1 break-words text-xs text-muted-foreground">{inquiry.company}</p> : null}
                <p className={`mt-3 text-xs leading-5 ${isInquiryDue(inquiry, now) ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{inquiry.follow_up_at ? <>{isInquiryDue(inquiry, now) ? "Overdue · " : "Follow-up · "}<InquiryTime value={inquiry.follow_up_at} /></> : inquiry.status === "new" ? "Awaiting your review" : "No follow-up scheduled"}</p>
              </Link></li>)}
            </ul>
          ) : <p className="p-5 text-sm leading-relaxed text-muted-foreground">{view === "due" ? "No follow-ups are due. Scheduled active conversations will appear here when it’s time." : page > 1 ? "No inquiries on this page. Use Previous to return to your queue." : "No inquiries in this view. Choose another status to see the rest of your inbox."}</p>}
          {(page > 1 || (inbox.count ?? 0) > page * INQUIRY_PAGE_SIZE) ? <nav aria-label="Inquiry pages" className="flex flex-wrap justify-between gap-3 border-t border-border p-5">{page > 1 ? <Link className="text-sm text-primary underline underline-offset-4" href={inboxHref(view, page - 1)}>← Previous</Link> : <span />}<span className="text-xs text-muted-foreground">Page {page}</span>{(inbox.count ?? 0) > page * INQUIRY_PAGE_SIZE ? <Link className="text-sm text-primary underline underline-offset-4" href={inboxHref(view, page + 1)}>Next →</Link> : <span />}</nav> : null}
        </section>

        <section id="inquiry-detail" aria-labelledby="inquiry-detail-heading" className="min-w-0 scroll-mt-6 rounded-xl border border-border bg-card p-5 sm:p-7">
          {selected ? <>
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow">Inquiry #{selected.id}</p><span className="rounded-full border border-border px-3 py-1 text-xs">{INQUIRY_STATUS_LABELS[selected.status]}</span></div>
            <h2 id="inquiry-detail-heading" className="mt-4 break-words font-display text-2xl sm:text-3xl">{selected.subject || "A project conversation"}</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Received <InquiryTime value={selected.created_at} /></p>
            <dl className="my-6 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["Name", selected.full_name], ["Email", selected.email], ["Company", selected.company], ["Phone", selected.phone],
                ["Budget", selected.budget], ["Timeline", selected.timeline], ["Preferred contact", selected.preferred_contact],
                ["Source page", selected.source_path], ["Project of interest", selected.source_project],
              ].filter(([, value]) => value).map(([label, value]) => <div className="min-w-0" key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
            </dl>
            <div className="rounded-lg bg-muted/40 p-4"><h3 className="text-xs font-semibold text-muted-foreground">Their message</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{selected.message || "No message was provided."}</p></div>
            <div className="my-6">{replyHref ? <Button asChild variant="outline"><a href={replyHref}><Mail aria-hidden="true" className="size-4" />Reply by email</a></Button> : <p className="text-sm text-muted-foreground">No usable email address was provided.</p>}<p className="mt-2 text-xs leading-5 text-muted-foreground">Opens your email app. Mark the inquiry Contacted after you reply.</p></div>
            <InquiryFollowUpForm key={selected.id} inquiry={{ id: selected.id, updated_at: selected.updated_at, status: selected.status, follow_up_at: selected.follow_up_at, internal_notes: selected.internal_notes }} />
          </> : <><h2 id="inquiry-detail-heading" className="font-display text-xl">{inbox.selectedUnavailable ? "Inquiry unavailable" : "Your next conversation"}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{inbox.selectedUnavailable ? "This inquiry couldn’t be loaded or is no longer available. Choose one from your inbox or refresh to try again." : "Choose an inquiry to read the message and schedule a follow-up."}</p></>}
        </section>
      </div>
    </main>
  );
}
