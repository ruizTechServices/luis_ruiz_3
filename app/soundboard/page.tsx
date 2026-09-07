import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Soundboard, SoundboardUnavailable } from "@/components/soundboard/soundboard";
import { getPublicSounds } from "@/lib/soundboard/data";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata(
  "Soundboard — Reactions & Sound Effects",
  "Gio’s original soundboard is back. Play reaction sounds, save favorites, try today’s pick, and share a sound with a friend. Free to use in your browser.",
  "/soundboard",
  "/soundboard/opengraph-image",
);

export default async function SoundboardPage({ searchParams }: {
  searchParams: Promise<{ sound?: string | string[] }>;
}) {
  const [{ clips, unavailable }, params] = await Promise.all([getPublicSounds(), searchParams]);
  const requested = params.sound;
  const initialSoundId = typeof requested === "string" && clips.some((sound) => sound.id === requested) ? requested : null;

  return <main id="main-content" className="site-container py-12 sm:py-20">
    <header className="mb-10 grid items-end gap-6 md:grid-cols-[1.2fr_1fr] md:gap-16">
      <div>
        <p className="eyebrow mb-5">Gio’s soundboard{!unavailable && ` / ${clips.length} sounds`}</p>
        <h1 className="font-display text-5xl leading-[1.08] tracking-[-.035em] sm:text-7xl">Press play.<br /><span className="italic text-primary">Make a little noise.</span></h1>
      </div>
      <p className="max-w-md text-base leading-8 text-muted-foreground">The original collection is back. Save your go-to reactions, explore today’s pick, and send someone the perfect sound. Come back anytime; your favorites will be waiting in this browser.</p>
    </header>

    {unavailable ? <SoundboardUnavailable /> : <Soundboard key={initialSoundId ?? "default"} clips={clips} initialSoundId={initialSoundId} />}

    <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
      <div><h2 className="font-display text-2xl">Have an interactive idea of your own?</h2><p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">I build websites and practical tools, with room for a little personality.</p></div>
      <Link href="/contact?service=Build%20a%20website%20or%20app" className="text-link">Let’s build something <ArrowUpRight size={16} /></Link>
    </section>
  </main>;
}
