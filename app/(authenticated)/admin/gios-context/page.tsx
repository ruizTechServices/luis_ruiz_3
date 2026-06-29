import Link from "next/link";

import { GiosContextForm } from "@/app/(authenticated)/admin/gios-context/gios-context-form";
import { GiosContextList } from "@/app/(authenticated)/admin/gios-context/gios-context-list";
import { listGiosContextRows } from "@/lib/admin/gios_context/queries";
import { requireGioAdmin } from "@/lib/auth/admin";

export default async function GiosContextAdminPage() {
  await requireGioAdmin();
  const rows = await listGiosContextRows();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">Gio context</h1>
        <p className="text-sm text-muted-foreground">Create, edit, and delete admin-only context rows.</p>
      </section>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
        <GiosContextForm mode="create" />
      </section>

      <GiosContextList rows={rows} />
    </main>
  );
}

