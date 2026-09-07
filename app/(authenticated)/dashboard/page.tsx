import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { GioWorkspace } from "@/components/dashboard/gio-workspace";
import { Button } from "@/components/ui/button";
import { isGioAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";
import { DASHBOARD_PAGE_TABLES, getDashboardMetrics } from "@/lib/dashboard/data";
import { getGioOverview, getOwnerNextActions } from "@/lib/dashboard/overview";

const descriptions: Record<string, string> = {
  projects: "Keep track of the work and its next step.",
  clients: "The people and businesses you work with.",
  leads: "Follow up on your next opportunity.",
  money: "Record income, expenses, and project costs.",
  decisions: "Keep the reasoning behind your choices.",
  links: "The tools and references you return to.",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const adminAccess = isGioAdmin();
  const [isAdmin, metrics, nextActions, overview] = await Promise.all([
    adminAccess,
    getDashboardMetrics(user).catch(() => null),
    getOwnerNextActions(user).catch(() => null),
    adminAccess.then((allowed) => allowed ? getGioOverview().catch(() => null) : null),
  ]);

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-9 px-6 py-12 sm:py-16">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">{isAdmin ? "Welcome back, Gio." : "Your dashboard."}</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{isAdmin ? "Write something useful. Show your work. Follow up on an opportunity." : "Keep your projects, contacts, and next steps in one place."}</p>
        </div>
        <Button asChild variant="outline"><Link href="/">View the website <ArrowUpRight aria-hidden="true" className="size-4" /></Link></Button>
      </header>

      {isAdmin ? <GioWorkspace overview={overview} /> : null}

      <section aria-labelledby="business-heading" className="border-t border-border pt-9">
        <div className="mb-5">
          <h2 className="font-display text-2xl" id="business-heading">Your business, in one place.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Private records for {user.email ?? "your account"}.</p>
        </div>
        {!metrics ? <p className="mb-4 text-sm text-muted-foreground">Counts are temporarily unavailable. Your workspace links are still below.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_PAGE_TABLES.map((table, index) => (
            <Link className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40" href={`/dashboard/${table.slug}`} key={table.slug}>
              <div className="flex items-center justify-between gap-4"><h3 className="text-sm font-semibold">{table.slug === "projects" ? "Working projects" : table.label}</h3><ArrowUpRight aria-hidden="true" className="size-4 text-primary" /></div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{descriptions[table.slug]}</p>
              <p className="mt-5 font-display text-3xl">{metrics?.[index]?.count ?? <span className="font-sans text-sm text-muted-foreground">Unavailable</span>}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="next-actions-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl" id="next-actions-heading">Pick up where you left off.</h2><Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/projects">Open working projects →</Link></div>
        {nextActions?.length ? (
          <ul className="mt-5 divide-y divide-border">{nextActions.map((project) => <li className="py-4" key={project.id}><p className="text-sm font-semibold">{project.name}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{project.next_action}</p></li>)}</ul>
        ) : <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{nextActions === null ? "Project next steps couldn’t be loaded. Open your working projects to try again." : "Add a next action to a working project and it will appear here when you return."}</p>}
      </section>
    </main>
  );
}
