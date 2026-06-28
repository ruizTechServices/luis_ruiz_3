import Link from "next/link";

import {
  createDashboardRecord,
  deleteDashboardRecord,
  updateDashboardRecord,
} from "@/app/(authenticated)/dashboard/actions";
import { Button } from "@/components/ui/button";
import type { AuthenticatedUser } from "@/lib/auth/session";
import {
  getDashboardRows,
  type DashboardField,
  type DashboardPageConfig,
  type DashboardRow,
} from "@/lib/dashboard/data";
import { formatDate } from "@/lib/data/format";

export async function DashboardTablePage({
  slug,
  user,
}: {
  slug: string;
  user: AuthenticatedUser;
}) {
  const { config, rows } = await getDashboardRows(user, slug);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard">
          Dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">{config.label}</h1>
        <p className="text-sm text-muted-foreground">
          Owner-scoped rows for {user.email ?? user.id}.
        </p>
      </section>
      <section className="rounded-md border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
        <DashboardRecordForm action={createDashboardRecord} config={config} submitLabel="Create" />
      </section>
      <section className="grid gap-4">
        {rows.length > 0 ? (
          rows.map((row) => <DashboardRowCard config={config} key={String(row.id)} row={row} />)
        ) : (
          <p className="text-sm text-muted-foreground">No rows yet.</p>
        )}
      </section>
    </main>
  );
}

function DashboardRowCard({ config, row }: { config: DashboardPageConfig; row: DashboardRow }) {
  return (
    <article className="grid gap-4 rounded-md border border-border p-4">
      <div className="grid gap-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold tracking-normal">#{String(row.id)}</h2>
          {typeof row.created_at === "string" ? (
            <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
          ) : null}
        </div>
        <dl className="grid gap-2">
          {Object.entries(row)
            .filter(([key]) => key !== "id" && key !== "user_id")
            .map(([key, value]) => (
              <div className="grid gap-1" key={key}>
                <dt className="text-xs font-medium uppercase text-muted-foreground">{key}</dt>
                <dd className="whitespace-pre-wrap break-words">{formatDashboardValue(value)}</dd>
              </div>
            ))}
        </dl>
      </div>
      <DashboardRecordForm
        action={updateDashboardRecord}
        config={config}
        row={row}
        submitLabel="Update"
      />
      <form action={deleteDashboardRecord}>
        <input name="table" type="hidden" value={config.slug} />
        <input name="id" type="hidden" value={String(row.id)} />
        <Button size="sm" type="submit" variant="destructive">
          Delete
        </Button>
      </form>
    </article>
  );
}

function DashboardRecordForm({
  action,
  config,
  row,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  config: DashboardPageConfig;
  row?: DashboardRow;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      <input name="table" type="hidden" value={config.slug} />
      {row ? <input name="id" type="hidden" value={String(row.id)} /> : null}
      {config.fields.map((field) => (
        <DashboardFieldControl field={field} key={field.name} value={row?.[field.name]} />
      ))}
      <Button className="w-fit" size="sm" type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}

function DashboardFieldControl({
  field,
  value,
}: {
  field: DashboardField;
  value: DashboardRow[string] | undefined;
}) {
  const sharedClassName = "rounded-md border border-input bg-background px-3 py-2";

  if (field.type === "textarea") {
    return (
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{field.label}</span>
        <textarea
          className={`${sharedClassName} min-h-24`}
          defaultValue={typeof value === "string" ? value : ""}
          name={field.name}
          required={field.required}
        />
      </label>
    );
  }

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{field.label}</span>
      <input
        className={sharedClassName}
        defaultValue={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        name={field.name}
        required={field.required}
        type={field.type === "number" || field.type === "date" ? field.type : "text"}
      />
    </label>
  );
}

function formatDashboardValue(value: DashboardRow[string]): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null || typeof value === "undefined" || value === "") {
    return "Empty";
  }

  return String(value);
}
