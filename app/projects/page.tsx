import Link from "next/link";

import {
  PortfolioCard,
  PortfolioCardContent,
  PortfolioCardDescription,
  PortfolioCardHeader,
  PortfolioCardTitle,
} from "@/components/home/portfolio-card";
import { Button } from "@/components/ui/button";
import { firstParagraph } from "@/lib/data/format";
import { getProjects } from "@/lib/public-content/data";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Projects</h1>
        <p className="text-sm text-muted-foreground">Public portfolio records from Supabase.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {projects.length > 0 ? (
          projects.map((project) => (
            <PortfolioCard className="max-w-none" key={project.id}>
              <PortfolioCardHeader>
                <PortfolioCardTitle>{project.title ?? project.slug}</PortfolioCardTitle>
                <PortfolioCardDescription>
                  {project.category ?? "project"} | {project.status ?? "active"}
                </PortfolioCardDescription>
              </PortfolioCardHeader>
              <PortfolioCardContent>
                <p className="mb-4 text-muted-foreground">
                  {firstParagraph(project.summary ?? project.description)}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/projects/${project.slug}`}>Open</Link>
                </Button>
              </PortfolioCardContent>
            </PortfolioCard>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No public projects yet.</p>
        )}
      </section>
    </main>
  );
}
