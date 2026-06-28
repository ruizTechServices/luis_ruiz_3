import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/data/format";
import { getProjectBySlug } from "@/lib/public-content/data";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  const sections = [
    ["Context", project.context],
    ["Problem", project.problem],
    ["Constraints", project.constraints],
    ["Approach", project.approach],
    ["Architecture", project.architecture],
    ["Decisions", project.decisions],
    ["Outcomes", project.outcomes],
    ["Current status", project.current_status],
  ] as const;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-start gap-8 px-6 py-16">
      <section className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          {project.category ?? "project"} | {project.status ?? "active"} | Updated{" "}
          {formatDate(project.updated_at)}
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">{project.title ?? project.slug}</h1>
        <p className="text-muted-foreground">{project.summary ?? project.description ?? "No summary yet."}</p>
        <div className="flex flex-wrap gap-2">
          {project.live_url ? (
            <Button asChild size="sm">
              <Link href={project.live_url}>Live</Link>
            </Button>
          ) : null}
          {project.repo_url ? (
            <Button asChild size="sm" variant="outline">
              <Link href={project.repo_url}>Repo</Link>
            </Button>
          ) : null}
        </div>
      </section>
      <section className="grid gap-4">
        {sections.map(([label, value]) =>
          value ? (
            <article className="rounded-md border border-border p-4" key={label}>
              <h2 className="text-sm font-semibold tracking-normal">{label}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{value}</p>
            </article>
          ) : null,
        )}
      </section>
    </main>
  );
}
