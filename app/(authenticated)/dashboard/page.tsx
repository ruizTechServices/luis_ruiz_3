import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/dashboard/data";

export default async function DashboardPage() {
  const user = await requireUser();
  const metrics = await getDashboardMetrics(user);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email ?? user.id}.
        </p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <article
            className="rounded-md border border-border bg-card px-4 py-3"
            key={metric.label}
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </h2>
            <p className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
              {metric.count}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
