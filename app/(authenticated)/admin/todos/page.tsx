import Link from "next/link";

import { TodoForm } from "@/app/(authenticated)/admin/todos/todos-form";
import { TodoList } from "@/app/(authenticated)/admin/todos/todos-list";
import { listTodoRows } from "@/lib/admin/todos/queries";
import { requireGioAdmin } from "@/lib/auth/admin";

export default async function TodosAdminPage() {
  await requireGioAdmin();
  const rows = await listTodoRows();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">Todos</h1>
        <p className="text-sm text-muted-foreground">Create, edit, complete, position, and delete tasks.</p>
      </section>

      <section className="rounded-md border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
        <TodoForm mode="create" />
      </section>

      <TodoList rows={rows} />
    </main>
  );
}

