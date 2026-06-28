import Link from "next/link";

import { getAdminOverview } from "@/lib/admin/data";

export default async function AdminLegacyAiPage() {
  const { legacyCounts } = await getAdminOverview();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">Legacy AI inventory</h1>
        <p className="text-sm text-muted-foreground">
          Read-only counts for legacy AI persistence tables. Review before productizing.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {legacyCounts.map((item) => (
          <article className="rounded-md border border-border p-4" key={item.table}>
            <h2 className="text-sm font-medium text-muted-foreground">{item.table}</h2>
            <p className="mt-2 text-2xl font-semibold tracking-normal">{item.count}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
