import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { SoundboardManager } from "@/components/soundboard/soundboard-manager";
import { requireGioAdmin } from "@/lib/auth/admin";
import { getManagedSounds } from "@/lib/soundboard/data";

export const metadata: Metadata = { title: "Manage your soundboard", robots: { index: false, follow: false } };

export default async function SoundboardManagerPage() {
  await requireGioAdmin();
  const sounds = await getManagedSounds().catch(() => null);
  return <main id="main-content" className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
    <Link href="/dashboard" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Dashboard</Link>
    <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">Your soundboard</p><h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">Keep the good sounds coming.</h1><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Upload a clip, preview it, and publish when it’s ready. Edit names or archive a pad whenever you like.</p></div><Link href="/soundboard" target="_blank" className="text-link">Open public soundboard <ArrowUpRight size={16} /></Link></div>
    <SoundboardManager clips={sounds ?? []} loadFailed={sounds === null} />
  </main>;
}
