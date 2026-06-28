import Link from "next/link";

import {
  createAdminRecord,
  deleteAdminRecord,
  updateAdminRecord,
} from "@/app/(authenticated)/admin/actions";
import { type AdminField, type AdminTableConfig } from "@/lib/admin/config";
import { getAdminRows, type AdminRow } from "@/lib/admin/data";
import { formatDate } from "@/lib/data/format";
import { Button } from "@/components/ui/button";

export async function AdminTablePage({ slug }: { slug: string }) {
  const { config, rows } = await getAdminRows(slug);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Admin
        </Link>
        <h1 className="text-3xl font-semibold tracking-normal">{config.title}</h1>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </section>

      {!config.readOnly && !config.deleteOnly && !config.createDisabled && config.fields.length > 0 ? (
        <section className="rounded-md border border-border p-4">
          <h2 className="mb-4 text-lg font-semibold tracking-normal">Create</h2>
          <AdminRecordForm action={createAdminRecord} config={config} submitLabel="Create" />
        </section>
      ) : null}

      <section className="grid gap-4">
        {rows.length > 0 ? (
          rows.map((row) => <AdminRowCard config={config} key={String(row.id)} row={row} />)
        ) : (
          <p className="text-sm text-muted-foreground">No rows visible.</p>
        )}
      </section>
    </main>
  );
}

function AdminRowCard({ config, row }: { config: AdminTableConfig; row: AdminRow }) {
  const canEdit = !config.readOnly && !config.deleteOnly && config.fields.length > 0;
  const canDelete = !config.readOnly;

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
            .filter(([key]) => key !== "id")
            .map(([key, value]) => (
              <div className="grid gap-1" key={key}>
                <dt className="text-xs font-medium uppercase text-muted-foreground">{key}</dt>
                <dd className="whitespace-pre-wrap break-words">{formatAdminValue(value)}</dd>
              </div>
            ))}
        </dl>
      </div>

      {canEdit ? (
        <AdminRecordForm
          action={updateAdminRecord}
          config={config}
          row={row}
          submitLabel="Update"
        />
      ) : null}

      {canDelete ? (
        <form action={deleteAdminRecord}>
          <input name="table" type="hidden" value={config.slug} />
          <input name="id" type="hidden" value={String(row.id)} />
          <Button size="sm" type="submit" variant="destructive">
            Delete
          </Button>
        </form>
      ) : null}
    </article>
  );
}

function AdminRecordForm({
  action,
  config,
  row,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  config: AdminTableConfig;
  row?: AdminRow;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      <input name="table" type="hidden" value={config.slug} />
      {row ? <input name="id" type="hidden" value={String(row.id)} /> : null}
      {config.fields.map((field) => (
        <AdminFieldControl field={field} key={field.name} value={row?.[field.name]} />
      ))}
      <Button className="w-fit" size="sm" type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}

function AdminFieldControl({
  field,
  value,
}: {
  field: AdminField;
  value: AdminRow[string] | undefined;
}) {
  const sharedClassName = "rounded-md border border-input bg-background px-3 py-2";

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={value === true} name={field.name} type="checkbox" />
        {field.label}
      </label>
    );
  }

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
      />
    </label>
  );
}

function formatAdminValue(value: AdminRow[string]): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (value === null || typeof value === "undefined" || value === "") {
    return "Empty";
  }

  return String(value);
}
