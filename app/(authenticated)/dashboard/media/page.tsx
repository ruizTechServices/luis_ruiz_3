import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MediaLibrary } from "@/components/media/media-library";
import { requireGioAdmin } from "@/lib/auth/admin";
import { getMediaImages } from "@/lib/media/data";

export const metadata: Metadata = { title: "Your images", robots: { index: false, follow: false } };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ folder?: string; page?: string }> }) {
  await requireGioAdmin();
  const params = await searchParams;
  const folder = params.folder === "hero" ? "hero" : "portfolio";
  const requestedPage = Number(params.page ?? "0");
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 1000 ? requestedPage : 0;
  const result = await getMediaImages(folder, page).catch(() => null);

  return (
    <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Dashboard</Link>
      <p className="eyebrow">Your media</p>
      <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Give your work a picture.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Upload a screenshot or project image, then copy its link into a case study or add it to a story.</p>
      <MediaLibrary key={`${folder}:${page}`} images={result?.images ?? []} folder={folder} page={page} hasMore={result?.hasMore ?? false} loadFailed={result === null} />
    </main>
  );
}
