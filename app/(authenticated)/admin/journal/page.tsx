import Link from "next/link";

import { JournalForm } from "@/app/(authenticated)/admin/journal/journal-form";
import { JournalList } from "@/app/(authenticated)/admin/journal/journal-list";
import { requireGioAdmin } from "@/lib/auth/admin";
import { listJournalRows } from "@/lib/admin/journal/queries";

export default async function JournalAdminPage() {
  await requireGioAdmin();
  const rows = await listJournalRows();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">Journal</h1>
        <p className="text-sm text-muted-foreground">Create, edit, and delete Gio-only journal rows.</p>
      </section>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
        <JournalForm mode="create" />
      </section>

      <JournalList rows={rows} />
    </main>
  );
}

