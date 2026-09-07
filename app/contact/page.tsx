import { pageMetadata } from "@/lib/seo/metadata";
import { CONTACT_TOPICS } from "@/lib/contact/topics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ContactForm } from "@/app/contact/contact-form";

export const metadata = pageMetadata("Work with Luis Ruiz", "Tell Luis Ruiz what you need to build or fix. Start a project conversation with a New York web developer working in English and Spanish.", "/contact");

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string; project?: string }> }) {
  const { service, project } = await searchParams;
  const initialTopic = CONTACT_TOPICS.find(topic => topic === service) ?? "Not sure yet";
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <section>
          <p className="eyebrow">Let’s work together</p>
          <h1 className="mt-5 font-display text-5xl leading-[1.08] tracking-tight sm:text-6xl">Good work starts<br className="hidden sm:block" /> with a conversation.</h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">A new website. A stubborn problem. An idea that needs a working prototype. Tell me what you have in mind.</p>
          <div className="mt-10 border-t border-border pt-7">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <ol className="mt-5 grid gap-5 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-4"><span className="font-mono text-xs text-primary">01</span><span>I review your goal and what’s already in place.</span></li>
              <li className="flex gap-4"><span className="font-mono text-xs text-primary">02</span><span>We clarify the scope, constraints, and whether I’m the right fit.</span></li>
              <li className="flex gap-4"><span className="font-mono text-xs text-primary">03</span><span>We agree on the work, price, and next steps before starting.</span></li>
            </ol>
          </div>
          <p className="mt-9 text-sm text-muted-foreground">New York City · English &amp; Spanish</p>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" href="/projects">See what I’m building <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
        </section>
        <ContactForm initialTopic={initialTopic} initialMessage={project ? `I’m interested in something like ${project.slice(0,240)}. ` : ""} />
      </div>
    </main>
  );
}
