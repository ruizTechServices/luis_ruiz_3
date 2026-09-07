import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getProjectEvidence } from "@/components/projects/project-evidence-data";

export function ProjectEvidence({ projectId }: { projectId: number }) {
  const evidence = getProjectEvidence(projectId);

  if (!evidence) return null;

  return (
    <section aria-labelledby="project-evidence-title" className="mt-16 border-t border-border pt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-3">See the work</p>
          <h2 id="project-evidence-title" className="font-display text-3xl sm:text-4xl">
            From the live product
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Screens captured {new Intl.DateTimeFormat("en-US", {
            month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
          }).format(new Date(`${evidence.capturedAt}T00:00:00Z`))}
        </p>
      </div>

      <div className={`grid items-start gap-6 ${evidence.screenshots.length > 1 ? "lg:grid-cols-2" : "max-w-4xl"}`}>
        {evidence.screenshots.map((screenshot) => (
          <figure key={screenshot.src} className="overflow-hidden rounded-xl border border-border bg-card">
            <a href={screenshot.src} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Image
                src={screenshot.src}
                alt={screenshot.alt}
                width={screenshot.width}
                height={screenshot.height}
                sizes={evidence.screenshots.length > 1 ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 1024px) 896px, 100vw"}
                className="h-auto w-full"
              />
              <span className="sr-only">Open full screenshot in a new tab</span>
            </a>
            <figcaption className="border-t border-border p-5 text-sm leading-6 text-muted-foreground">
              {screenshot.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {evidence.checks.map((check) => (
          <div key={check.title} className="rounded-xl border border-border p-6">
            <h3 className="font-semibold">{check.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{check.detail}</p>
            <a href={check.href} target="_blank" rel="noopener noreferrer" className="text-link mt-4 text-sm">
              {check.linkLabel} <ArrowUpRight size={15} className="shrink-0" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
