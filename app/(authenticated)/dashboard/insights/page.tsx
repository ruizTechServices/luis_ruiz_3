import Link from "next/link";
import type { Metadata } from "next";

import { requireGioAdmin } from "@/lib/auth/admin";
import { getSiteInsights, type InsightPathRow } from "@/lib/analytics/data";

export const metadata: Metadata = { title: "Site insights", robots: { index: false, follow: false } };

const number = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
function dayLabel(day: string) { return date.format(new Date(`${day}T00:00:00Z`)); }

function PathTable({ rows, empty, inquiries = false }: { rows: InsightPathRow[]; empty: string; inquiries?: boolean }) {
  if (!rows.length) return <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{empty}</p>;
  return <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
    <thead className="border-b border-border text-muted-foreground"><tr><th scope="col" className="py-3 pr-4 font-medium">Page</th><th scope="col" className="py-3 text-right font-medium">{inquiries ? "Inquiries" : "Views"}</th></tr></thead>
    <tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.page_path}>
      <th scope="row" className="max-w-72 break-words py-3 pr-4 font-normal"><Link className="text-primary underline-offset-4 hover:underline" href={row.page_path}>{row.page_path}</Link></th>
      <td className="py-3 text-right tabular-nums">{number.format(inquiries ? row.inquiries : row.views)}</td>
    </tr>)}</tbody>
  </table></div>;
}

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireGioAdmin();
  const query = await searchParams;
  const days = query.days === "7" ? 7 : query.days === "90" ? 90 : 30;
  const insights = await getSiteInsights(days);

  return <main id="main-content" className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:py-16">
    <header>
      <Link className="text-sm text-primary hover:underline" href="/dashboard">← Your dashboard</Link>
      <p className="eyebrow mt-7">Attention into opportunity</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Site insights.</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">See which work gets attention, where project inquiries begin, and whether the soundboard gives browsers a reason to return.</p>
      <nav aria-label="Measurement period" className="mt-6 flex flex-wrap gap-2">{([7, 30, 90] as const).map((period) => <Link key={period} href={`/dashboard/insights?days=${period}`} aria-current={period === days ? "page" : undefined} className={`rounded-full border px-4 py-2.5 text-sm ${period === days ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{period} days</Link>)}</nav>
    </header>

    {!insights ? <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">Measurements are unavailable.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The report couldn’t load. Refresh this page shortly. Your inquiries and content are still available from the dashboard.</p></section> : <>
      <p className="text-sm text-muted-foreground">{dayLabel(insights.since)}–{dayLabel(insights.through)}, UTC · {insights.first_day ? `Earliest retained activity: ${dayLabel(insights.first_day)}.` : "No visitor activity has been recorded yet. Counts start with this release; historical traffic is not imported."}</p>
      <section aria-label="Site totals" className="grid gap-4 sm:grid-cols-3">
        {[{ label: "Public page views", value: insights.page_views, note: "Visits to measured public pages, including repeat views." }, { label: "Case study views", value: insights.project_views, note: "Views of individual project pages." }, { label: "Measured inquiries", value: insights.inquiries, note: "Successfully saved inquiries with measurement enabled." }].map((stat) => <div className="rounded-xl border border-border bg-card p-5" key={stat.label}><h2 className="text-sm font-semibold">{stat.label}</h2><p className="mt-4 font-display text-4xl tabular-nums">{number.format(stat.value)}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stat.note}</p></div>)}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">Projects getting attention</h2><PathTable rows={insights.top_projects} empty="Case study views will appear when visitors explore your projects." /></section>
        <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">Pages before an inquiry</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The last public page seen in that tab within 30 minutes. /contact includes direct or unattributed inquiries. This is a clue about interest, not proof that a page caused a sale.</p><PathTable rows={insights.inquiry_sources} inquiries empty="Source pages will appear after a visitor submits an inquiry with measurement enabled." /></section>
      </div>
      <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">A reason to return</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">{[{ label: "Soundboard page views", value: insights.soundboard_views }, { label: "Sound starts", value: insights.sound_plays }, { label: "Estimated later-day returns", value: insights.soundboard_returns }].map((stat) => <div key={stat.label}><p className="text-sm font-medium">{stat.label}</p><p className="mt-3 font-display text-4xl tabular-nums">{number.format(stat.value)}</p></div>)}</div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">A browser revisiting on a later UTC date within 90 days can send a return signal. Clearing storage, using another device, simultaneous tabs, privacy preferences, or blocked requests changes the estimate. These counts do not represent unique people. Sound starts include restarts; rapid repeats may be limited.</p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">Most viewed pages</h2><PathTable rows={insights.top_pages} empty="Public page views will appear as visitors arrive." /></section>
        <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-display text-2xl">Recent daily activity</h2>{insights.daily.length ? <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3 font-medium" scope="col">Day (UTC)</th><th className="py-3 text-right font-medium" scope="col">Views</th><th className="py-3 text-right font-medium" scope="col">Inquiries</th></tr></thead><tbody className="divide-y divide-border">{insights.daily.slice(0, 14).map((day) => <tr key={day.metric_day}><th className="py-3 font-normal" scope="row">{dayLabel(day.metric_day)}</th><td className="py-3 text-right tabular-nums">{number.format(day.views)}</td><td className="py-3 text-right tabular-nums">{number.format(day.inquiries)}</td></tr>)}</tbody></table></div> : <p className="mt-5 text-sm text-muted-foreground">Your first measured visits will start this report.</p>}</section>
      </div>
    </>}
    <aside className="border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground"><h2 className="font-semibold text-foreground">How to read these numbers</h2><p className="mt-2 max-w-3xl">Measurements cover signed-out browsers on public pages. Do Not Track, Global Privacy Control, and the visitor’s measurement preference are honored. Only daily counts and public paths are retained for 90 days. Short-lived security counters help limit abuse; automated traffic and blocked requests can still affect totals. Use <Link href="/dashboard/inquiries" className="text-primary hover:underline">your inquiry inbox</Link> for the full contact record.</p></aside>
  </main>;
}
