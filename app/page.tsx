import Link from "next/link";

import {
  PortfolioCard,
  PortfolioCardContent,
  PortfolioCardDescription,
  PortfolioCardHeader,
  PortfolioCardTitle,
} from "@/components/home/portfolio-card";
import { Button } from "@/components/ui/button";
import { firstParagraph, formatDate } from "@/lib/data/format";
import { getHomeContent } from "@/lib/public-content/data";

export default async function Home() {
  const { settings, projects, posts } = await getHomeContent();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-10 px-6 py-16">
      <section className="grid gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          {settings?.availability_text ?? "Available for selected work"}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-foreground">
          Luis Ruiz&apos;s Portfolio
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/projects">Projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">Blog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-normal">Featured projects</h2>
          <Link className="text-sm font-medium text-primary hover:underline" href="/projects">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <PortfolioCard className="max-w-none" key={project.id}>
                <PortfolioCardHeader>
                  <PortfolioCardTitle>{project.title ?? project.slug}</PortfolioCardTitle>
                  <PortfolioCardDescription>
                    {firstParagraph(project.summary ?? project.description)}
                  </PortfolioCardDescription>
                </PortfolioCardHeader>
                <PortfolioCardContent>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${project.slug}`}>Open</Link>
                  </Button>
                </PortfolioCardContent>
              </PortfolioCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No featured projects yet.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-normal">Recent posts</h2>
          <Link className="text-sm font-medium text-primary hover:underline" href="/blog">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PortfolioCard className="max-w-none" key={post.id}>
                <PortfolioCardHeader>
                  <PortfolioCardTitle>{post.title ?? `Post ${post.id}`}</PortfolioCardTitle>
                  <PortfolioCardDescription>{formatDate(post.created_at)}</PortfolioCardDescription>
                </PortfolioCardHeader>
                <PortfolioCardContent>
                  <p className="mb-4 text-muted-foreground">{firstParagraph(post.summary)}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/blog/${post.id}`}>Read</Link>
                  </Button>
                </PortfolioCardContent>
              </PortfolioCard>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
