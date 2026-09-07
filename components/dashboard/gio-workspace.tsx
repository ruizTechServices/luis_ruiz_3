import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckSquare, FolderKanban, Inbox, Link2, Settings2 } from "lucide-react";

import { WriterShortcut } from "@/components/dashboard/writer-shortcut";
import type { GioOverview } from "@/lib/dashboard/overview";

const actions = [
  { href: "/admin/projects", title: "Curate your portfolio", description: "Add work, improve a case study, or update a live demo.", icon: FolderKanban },
  { href: "/admin/contactlist", title: "Review inquiries", description: "See who reached out and plan your next conversation.", icon: Inbox },
  { href: "/dashboard/links", title: "Open your saved links", description: "Your writing room, tools, and project shortcuts.", icon: Link2 },
  { href: "/admin/todos", title: "Choose your next task", description: "Keep today’s work focused and mark progress.", icon: CheckSquare },
  { href: "/admin/journal", title: "Keep a private journal", description: "Capture a thought before it becomes a public story.", icon: BookOpen },
  { href: "/admin/site-settings", title: "Update your availability", description: "Keep the public site aligned with your capacity.", icon: Settings2 },
];

export function GioWorkspace({ overview }: { overview: GioOverview | null }) {
  const metrics = [
    { label: "Stories", value: overview?.stories, href: "/admin/blog-posts" },
    { label: "Public projects", value: overview?.publicProjects, href: "/admin/projects" },
    { label: "Total inquiries", value: overview?.inquiries, href: "/admin/contactlist" },
    { label: "Open tasks", value: overview?.openTasks, href: "/admin/todos" },
  ];

  return (
    <>
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
          <h2 className="font-display text-2xl" id="recent-inquiries-heading">Recent inquiries</h2>
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin/contactlist">Open inbox →</Link>
        </div>
        {overview?.recentInquiries === null || !overview ? (
          <p className="mt-5 text-sm text-muted-foreground">The inbox couldn’t be loaded. Open it to try again.</p>
        ) : overview.recentInquiries.length ? (
          <ul className="mt-5 divide-y divide-border">
            {overview.recentInquiries.map((inquiry) => (
              <li className="flex flex-wrap items-start justify-between gap-2 py-4" key={inquiry.id}>
                <div className="min-w-0"><p className="break-words text-sm font-medium">{inquiry.full_name || "Project inquiry"}</p><p className="mt-1 break-words text-sm text-muted-foreground">{inquiry.subject || "A new project conversation"}</p></div>
                <time className="text-xs text-muted-foreground" dateTime={inquiry.created_at}>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(inquiry.created_at))}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">No inquiries yet. Share a useful project or story, and point people to your <Link className="text-primary underline underline-offset-4" href="/contact">contact page</Link>.</p>
        )}
      </section>
    </>
  );
}
