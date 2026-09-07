import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WriterShortcut() {
  return (
    <section className="flex flex-col gap-6 rounded-xl border border-primary/15 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><PenLine aria-hidden="true" className="size-5" /></span>
        <div>
          <h2 className="font-display text-2xl">The writing room</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Document a decision, share what you learned, or turn a project into a story.</p>
          <Link className="mt-3 inline-block text-sm font-medium text-primary hover:underline" href="/admin/blog-posts">Manage existing stories</Link>
        </div>
      </div>
      <Button asChild className="h-11 shrink-0"><Link href="/dashboard/write">Write a story <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
    </section>
  );
}
