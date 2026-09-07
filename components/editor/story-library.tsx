import Link from "next/link";
import { ArrowLeft, ArrowUpRight, PenLine, Plus } from "lucide-react";

import type { StorySummary } from "@/lib/editor/types";

export function StoryLibrary({ stories }: { stories: StorySummary[] }) {
  const drafts = stories.filter((story) => story.status === "draft");
  const published = stories.filter((story) => story.status === "published");

  return (
    <main id="main-content" className="mx-auto min-h-[70vh] w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Dashboard</Link>
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Your writing desk</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Stories worth sharing.</h1>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">Document what you build, explain a decision, or share what you learned. Start here and publish when you’re ready.</p>
        </div>
        <Link href="/dashboard/write/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus size={17} /> Write a story</Link>
      </div>
      <StorySection title="Drafts" stories={drafts} empty="A fresh page is waiting. Your drafts stay private until you publish." />
      <StorySection title="Published" stories={published} empty="Your published stories will appear here and on your public blog." />
    </main>
  );
}

function StorySection({ title, stories, empty }: { title: string; stories: StorySummary[]; empty: string }) {
  return (
    <section className="mb-12" aria-label={title}>
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">{stories.length}</span>
      </div>
      {stories.length === 0 ? <p className="py-8 text-sm leading-6 text-muted-foreground">{empty}</p> : (
        <ul className="divide-y divide-border">
          {stories.map((story) => (
            <li key={story.id} className="flex flex-wrap items-center justify-between gap-5 py-6">
              <div className="min-w-0 flex-1 basis-60">
                <Link href={`/dashboard/write/${story.id}`} className="text-xl font-medium tracking-tight hover:underline">{story.title || "Untitled story"}</Link>
                {story.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{story.summary}</p>}
                <p className="mt-3 text-xs text-muted-foreground">Updated {new Date(story.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {story.status === "published" && <Link href={`/blog/${story.id}`} className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground">View <ArrowUpRight size={15} /></Link>}
                <Link href={`/dashboard/write/${story.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 hover:bg-muted"><PenLine size={14} /> Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
