import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata(
  "About Gio",
  "Meet Luis Ruiz, a Bronx-born web developer and founder of ruizTechServices. Explore his projects, practical approach, and notes on building with software and AI.",
  "/about",
);

export default function AboutPage() {
  return (
    <main id="main-content" className="site-container py-16 sm:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow mb-5">The person behind the projects</p>
          <h1 className="font-display text-5xl leading-[1.08] tracking-tight sm:text-7xl">
            Luis Ruiz.<br />
            <span className="italic text-primary">Call me Gio.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            I’m a Bronx-born web developer based in New York, working in English and
            Spanish. I founded ruizTechServices in 2024 and use this site to share
            what I’m building, explain my decisions, and connect with people who
            need practical technical help.
          </p>
          <Link href="/contact" className="text-link mt-7">
            Tell me what you have in mind <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <figure>
          <Image
            src="/images/gio-water.jpg"
            alt="Gio outdoors, sitting beside rocks and trees in a blue hoodie"
            width={1280}
            height={720}
            sizes="(min-width: 1200px) 544px, (min-width: 1024px) calc((100vw - 112px) / 2), calc(100vw - 48px)"
            className="h-auto w-full rounded-2xl border border-border"
          />
          <figcaption className="mt-4 text-xs text-muted-foreground">
            Luis “Gio” Ruiz · Developer &amp; founder of ruizTechServices
          </figcaption>
        </figure>
      </section>

      <section className="mt-16 grid gap-8 border-t border-border pt-10 sm:mt-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-4">A practical approach</p>
          <h2 className="font-display max-w-sm text-4xl leading-tight">
            Understand the problem.<br />Build something useful.
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-muted-foreground">
          <p>
            I’m interested in the parts of a website that make it useful: how someone
            finds what they need, completes a task, and knows what happens next.
            That includes the interface visitors see and the tools used to manage
            the work behind it.
          </p>
          <p>
            My projects use tools such as Next.js, TypeScript, React, and Supabase.
            I also explore AI integrations and automation through practical
            experiments. The project pages show the purpose and current state of
            the work; the build notes explain what I’m learning along the way.
          </p>
          <div className="flex flex-wrap gap-x-7 gap-y-4 pt-2 text-foreground">
            <Link href="/projects" className="text-link">
              Explore the projects <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
            <Link href="/blog" className="text-link">
              Read the build notes <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-secondary p-7 sm:mt-20 sm:p-10">
        <div>
          <p className="eyebrow mb-3">My business</p>
          <h2 className="font-display text-3xl">ruizTechServices</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            Need local tech help in New York? My business site explains the available
            services and how to request support.
          </p>
        </div>
        <a href="https://www.ruiztechservices.com" className="text-link">
          Visit ruizTechServices <ArrowUpRight aria-hidden="true" size={17} />
        </a>
      </section>
    </main>
  );
}
