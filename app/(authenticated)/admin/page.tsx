import Link from "next/link";

import { getAdminOverview } from "@/lib/admin/data";

export default async function AdminPage() {
  const { adminCounts } = await getAdminOverview();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-8 px-6 py-16">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Gio-only database surfaces. RLS remains the final database guard.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {adminCounts.map((item) => (
          <Link className="rounded-md border border-border p-4 hover:bg-muted/40" href={`/admin/${item.slug}`} key={item.slug}>
            <h2 className="text-lg font-semibold tracking-normal">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <p className="mt-3 text-2xl font-semibold tracking-normal">{item.count}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
