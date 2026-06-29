import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { firstParagraph, formatDate } from "@/lib/data/format";
import { buildPublicSitemapGroups, type PublicSitemapGroup } from "@/lib/seo/sitemap";

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "A human-readable directory of the public pages, projects, and articles on luis-ruiz.com.",
};

export default async function SitemapPage() {
  const groups = await buildPublicSitemapGroups();
  const totalLinks = groups.reduce((total, group) => total + group.links.length, 0);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-8 px-6 py-16">
      <section className="grid gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">Sitemap</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A clean directory of every public, indexable page on this site. Private account,
            dashboard, admin, authentication, and API routes are intentionally excluded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <Link href="/sitemap.xml">
              <FileText aria-hidden="true" />
              XML sitemap
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            {totalLinks} public URLs generated from site routes and Supabase content.
          </p>
        </div>
      </section>

      <section className="grid gap-5">
        {groups.map((group) => (
          <SitemapGroupSection group={group} key={group.title} />
        ))}
      </section>
    </main>
  );
}

function SitemapGroupSection({ group }: { group: PublicSitemapGroup }) {
  return (
    <section className="grid gap-3" aria-labelledby={sectionId(group.title)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold tracking-normal" id={sectionId(group.title)}>
            {group.title}
          </h2>
          <p className="text-sm text-muted-foreground">{group.description}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {group.links.length} {group.links.length === 1 ? "page" : "pages"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {group.links.map((link) => (
          <Link
            aria-label={`Open ${link.label}`}
            className="group rounded-md border border-border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            href={link.href}
            key={link.href}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="grid gap-1">
                <span className="text-sm font-semibold tracking-normal text-foreground">
                  {link.label}
                </span>
                <span className="text-sm leading-6 text-muted-foreground">
                  {firstParagraph(link.description, "Public site page.")}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </span>
            <span className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{link.meta}</span>
              <span>Updated {formatDate(link.lastModified)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function sectionId(value: string): string {
  return `sitemap-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
