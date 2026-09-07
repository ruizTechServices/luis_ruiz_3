import Link from "next/link";
import { ArrowUpRight, AudioLines, BookOpen, ChartNoAxesCombined, CheckSquare, FolderKanban, Inbox, Link2, Settings2 } from "lucide-react";

import { WriterShortcut } from "@/components/dashboard/writer-shortcut";
import { InquiryTime } from "@/components/inquiries/inquiry-time";
import type { GioOverview } from "@/lib/dashboard/overview";

const actions = [
  { href: "/admin/projects", title: "Curate your portfolio", description: "Add work, improve a case study, or update a live demo.", icon: FolderKanban },
  { href: "/dashboard/inquiries", title: "Review inquiries", description: "Reply, track the conversation, and schedule a follow-up.", icon: Inbox },
  { href: "/dashboard/insights", title: "See what gets attention", description: "Explore project views, inquiry sources, and soundboard returns.", icon: ChartNoAxesCombined },
  { href: "/dashboard/soundboard", title: "Add to the soundboard", description: "Upload a clip, choose a label, and publish it when it’s ready.", icon: AudioLines },
  { href: "/dashboard/links", title: "Open your saved links", description: "Your writing room, tools, and project shortcuts.", icon: Link2 },
  { href: "/admin/todos", title: "Choose your next task", description: "Keep today’s work focused and mark progress.", icon: CheckSquare },
  { href: "/admin/journal", title: "Keep a private journal", description: "Capture a thought before it becomes a public story.", icon: BookOpen },
  { href: "/admin/site-settings", title: "Update your availability", description: "Keep the public site aligned with your capacity.", icon: Settings2 },
];

export function GioWorkspace({ overview }: { overview: GioOverview | null }) {
  const metrics = [
    { label: "Stories", value: overview?.stories, href: "/admin/blog-posts" },
    { label: "Public projects", value: overview?.publicProjects, href: "/admin/projects" },
    { label: "Active inquiries", value: overview?.inquiries, href: "/dashboard/inquiries" },
    { label: "Open tasks", value: overview?.openTasks, href: "/admin/todos" },
  ];

  return (
    <>
      <section className="rounded-xl border border-primary/25 bg-primary/[0.03] p-6" aria-labelledby="follow-up-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">Start here today</p><h2 className="mt-2 font-display text-2xl" id="follow-up-heading">Keep your conversations moving.</h2></div>
          <Link className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline" href="/dashboard/inquiries">Open inbox →</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/inquiries?view=new" className="min-h-11 rounded-lg border border-border bg-card px-4 py-3 text-sm"><strong>{overview?.newInquiries ?? "Unavailable"}</strong> new inquiries</Link>
          <Link href="/dashboard/inquiries?view=due" className="min-h-11 rounded-lg border border-border bg-card px-4 py-3 text-sm"><strong>{overview?.dueInquiriesCount ?? "Unavailable"}</strong> follow-ups due</Link>
        </div>
        {!overview || overview.dueInquiries === null ? <p className="mt-4 text-sm text-muted-foreground">Follow-ups couldn’t be loaded. Open the inbox to try again.</p> : overview.dueInquiries.length ? <ul className="mt-4 divide-y divide-border">{overview.dueInquiries.map((inquiry) => <li key={inquiry.id}><Link href={`/dashboard/inquiries?view=due&id=${inquiry.id}#inquiry-detail`} className="flex flex-wrap items-start justify-between gap-2 py-4"><div className="min-w-0"><p className="break-words text-sm font-semibold">{inquiry.full_name || "Project inquiry"}</p><p className="mt-1 break-words text-sm text-muted-foreground">{inquiry.subject || "A project conversation"}</p></div><p className="text-xs leading-5 text-destructive">Overdue · {inquiry.follow_up_at ? <InquiryTime value={inquiry.follow_up_at} /> : null}</p></Link></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No follow-ups are due. Choose a date on an active inquiry and it will appear here when it’s time.</p>}
      </section>
      <WriterShortcut />
      <section aria-label="Your site at a glance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Link className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40" href={metric.href} key={metric.label}>
            <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">{metric.label}<ArrowUpRight aria-hidden="true" className="size-4 text-primary" /></span>
            <span className="mt-3 block font-display text-4xl">{metric.value ?? <span className="font-sans text-base text-muted-foreground">Unavailable</span>}</span>
          </Link>
        ))}
      </section>
      <section aria-labelledby="daily-actions-heading">
        <h2 className="mb-5 font-display text-2xl" id="daily-actions-heading">Make a little progress.</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ href, title, description, icon: Icon }) => (
            <Link className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-primary/[0.02]" href={href} key={href}>
              <div className="flex items-center justify-between text-primary"><Icon aria-hidden="true" className="size-5" /><ArrowUpRight aria-hidden="true" className="size-4" /></div>
              <h3 className="mt-5 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="recent-inquiries-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl" id="recent-inquiries-heading">Recent active inquiries</h2>
          <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/inquiries">Open inbox →</Link>
        </div>
        {overview?.recentInquiries === null || !overview ? (
          <p className="mt-5 text-sm text-muted-foreground">The inbox couldn’t be loaded. Open it to try again.</p>
        ) : overview.recentInquiries.length ? (
          <ul className="mt-5 divide-y divide-border">
            {overview.recentInquiries.map((inquiry) => (
              <li className="flex flex-wrap items-start justify-between gap-2 py-4" key={inquiry.id}>
                <Link href={`/dashboard/inquiries?id=${inquiry.id}#inquiry-detail`} className="min-w-0 hover:text-primary"><p className="break-words text-sm font-medium">{inquiry.full_name || "Project inquiry"}</p><p className="mt-1 break-words text-sm text-muted-foreground">{inquiry.subject || "A new project conversation"}</p></Link>
                <span className="text-xs text-muted-foreground"><InquiryTime value={inquiry.created_at} /></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">No active inquiries. Share a useful project or story, and point people to your <Link className="text-primary underline underline-offset-4" href="/contact">contact page</Link>.</p>
        )}
      </section>
    </>
  );
}
