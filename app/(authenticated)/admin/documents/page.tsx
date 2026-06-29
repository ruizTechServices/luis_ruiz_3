import Link from "next/link";

import { DocumentForm } from "@/app/(authenticated)/admin/documents/documents-form";
import { DocumentList } from "@/app/(authenticated)/admin/documents/documents-list";
import { listDocumentRows } from "@/lib/admin/documents/queries";
import { requireGioAdmin } from "@/lib/auth/admin";

export default async function DocumentsAdminPage() {
  await requireGioAdmin();
  const rows = await listDocumentRows();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">Documents</h1>
        <p className="text-sm text-muted-foreground">Create, edit, and delete admin document records.</p>
      </section>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
        <DocumentForm mode="create" />
      </section>

      <DocumentList rows={rows} />
    </main>
  );
}

