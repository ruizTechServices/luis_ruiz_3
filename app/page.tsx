import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Braces, Workflow, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { PostList } from "@/components/content/post-list";
import { getHomeContent } from "@/lib/public-content/data";
import { pageMetadata } from "@/lib/seo/metadata";
import { SOUND_CLIPS } from "@/lib/soundboard/catalog";
import { getOAuthFailureReason, getOAuthFailureRedirect } from "@/lib/auth/oauth-errors";

export const metadata = pageMetadata("Web Developer & Independent Builder", "I'm Luis Ruiz, a New York developer and founder of ruizTechServices. Explore my web projects, AI experiments, and build notes—or discuss your next project.", "/");
const services = [
  { icon: Braces, title: "A website that does its job.", description: "Clear, responsive websites that explain your offer and give customers a straightforward next step.", link: "Discuss a website", value: "Build a website or app" },
  { icon: Wrench, title: "Get past a website blocker.", description: "Bring the bug, broken flow, or unfinished feature. We’ll define a focused scope and what a successful fix looks like.", link: "Tell me what’s broken", value: "Fix or improve a website" },
  { icon: Workflow, title: "Make repetitive work easier.", description: "Practical tools, integrations, and AI prototypes built around a specific task—with room to test and improve.", link: "Explore an idea", value: "AI integration or automation" },
];
export default async function Home({ searchParams }: {
  searchParams: Promise<{ error?: string | string[]; error_code?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const authFailure = getOAuthFailureReason(params.error, params.error_code);
  if (authFailure) redirect(getOAuthFailureRedirect(authFailure, params.next));

  const { settings, projects, posts } = await getHomeContent();
  return <main id="main-content">
    <section className="site-container relative grid gap-12 pb-16 pt-16 md:grid-cols-[1.3fr_.7fr] md:gap-14 md:pb-20 md:pt-24">
      <div>
        <p className="eyebrow mb-7 flex items-center gap-3"><span className={`size-2 rounded-full ${settings?.availability ? "bg-primary" : "bg-muted-foreground"}`} />{settings?.availability_text || "New York · Independent developer"}</p>
        <h1 className="font-display max-w-3xl text-[clamp(3.4rem,6.5vw,6rem)] leading-[1.03] tracking-[-.045em]">Thoughtful code.<br />Useful things.<br /><span className="italic text-primary">Built by Gio.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">I’m Luis Ruiz, a New York web developer and founder of <a href="https://www.ruiztechservices.com" className="text-foreground underline decoration-border underline-offset-4">ruizTechServices</a>. I build websites, explore AI, and turn everyday problems into working software.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4"><Button asChild size="lg" className="h-12 rounded-full px-6"><Link href="/contact">Let’s work together <ArrowUpRight size={17} /></Link></Button><Link href="#selected-work" className="flex items-center gap-2 px-2 py-3 text-sm font-medium">Explore my work <ArrowDown size={15} /></Link></div>
        <p className="mt-7 font-mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">Based in the Bronx · Working in English & Spanish</p>
        <Link href="/about" className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline">A little more about me <ArrowUpRight aria-hidden="true" size={14} /></Link>
      </div>
      <aside className="builder-note relative self-center rounded-2xl border border-[#cdd5c4] bg-[#e9eddf] p-7 sm:p-9">
        <div className="mb-9 flex items-center justify-between"><span className="eyebrow">From the workbench</span><span className="font-mono text-xs text-primary">LR / 01</span></div>
        <div aria-hidden="true" className="mb-8 flex h-36 items-center justify-center"><div className="builder-orbit"><span className="font-display text-7xl italic text-primary">lr.</span><span className="orbit-point" /></div></div>
        <h2 className="font-display text-3xl leading-tight">The work is<br />the introduction.</h2>
        <p className="mt-4 text-sm leading-7 text-[#4c5846]">Real projects. Decisions explained. Lessons shared as I build.</p>
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[#c6cebc] pt-5"><div><p className="text-2xl font-medium">{projects.length.toString().padStart(2,"0")}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#53604b]">Selected projects</p></div><div><p className="text-2xl font-medium">↗</p><Link href="/blog" className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-[#53604b] hover:underline">Open build notes</Link></div></div>
      </aside>
    </section>
    <div className="border-y border-border"><div className="site-container flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-5"><span className="eyebrow">Tools I build with</span>{["Next.js", "TypeScript", "React", "Supabase", "AI APIs"].map(name => <span key={name} className="text-sm font-medium text-muted-foreground">{name}</span>)}</div></div>
    <section className="site-container py-16 sm:py-24" id="selected-work">
      <div className="section-heading"><div><p className="eyebrow mb-3">01 / Selected work</p><h2 className="font-display text-4xl sm:text-5xl">Less telling. More showing.</h2></div><Link href="/projects" className="text-link">All projects <ArrowUpRight size={17} /></Link></div>
      <div className="mt-9 grid gap-6 md:grid-cols-3">{projects.map((project,index) => <ProjectCard key={project.id} project={project} index={index} />)}</div>
    </section>
    <section className="border-y border-border bg-[#eef0e8]" id="work-together"><div className="site-container py-16 sm:py-20"><p className="eyebrow mb-3">02 / How I can help</p><h2 className="font-display max-w-xl text-4xl sm:text-5xl">A practical next step<br />for your next big thing.</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{services.map(({icon:Icon,...service}) => <article key={service.title} className="flex flex-col border-t border-[#cbd1c4] pt-6"><Icon size={25} strokeWidth={1.3} className="mb-6 text-primary" /><h3 className="text-lg font-semibold">{service.title}</h3><p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{service.description}</p><Link href={`/contact?service=${encodeURIComponent(service.value)}`} className="text-link mt-6">{service.link} <ArrowUpRight size={16} /></Link></article>)}</div></div></section>
    <section className="site-container py-16 sm:py-24"><div className="section-heading"><div><p className="eyebrow mb-3">03 / The notebook</p><h2 className="font-display text-4xl sm:text-5xl">Learning out loud.</h2></div><Link href="/blog" className="text-link">All writing <ArrowUpRight size={17} /></Link></div><p className="mb-8 mt-4 text-muted-foreground">Build notes, technical experiments, and a few things on my mind.</p><PostList posts={posts} /></section>
    <section id="soundboard" className="site-container pb-16">
      <div className="grid items-center gap-7 rounded-2xl border border-[#ded4b9] bg-[#f2eddc] p-7 sm:p-10 md:grid-cols-[auto_1fr_auto]">
        <div aria-hidden="true" className="flex size-20 items-center justify-center rounded-2xl border border-[#d7c9a3] bg-[#e7ddbd] text-[#6d5726]"><AudioLines size={40} strokeWidth={1.3} /></div>
        <div><p className="eyebrow mb-3 text-[#796333]">A little detour</p><h2 className="font-display text-3xl sm:text-4xl">The soundboard is back.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{SOUND_CLIPS.length} sounds from my original collection. Find your favorite reaction, save it for next time, or send it to a friend.</p></div>
        <Link href="/soundboard" className="inline-flex w-fit items-center gap-4 rounded-full border border-[#b7a575] px-5 py-4 text-sm font-semibold text-[#5b471e] transition-colors hover:bg-[#e7ddbd]">Open soundboard <ArrowUpRight size={17} /></Link>
      </div>
    </section>
    <section className="site-container pb-20"><div className="grid gap-8 rounded-2xl bg-primary px-7 py-12 text-primary-foreground md:grid-cols-[1fr_auto] md:items-center md:px-12"><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-white/70">Have something in mind?</p><h2 className="font-display text-4xl sm:text-5xl">Let’s make it work.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-white/80">Tell me what you need, what’s getting in the way, and where you want to go. We’ll start with a clear conversation.</p></div><Link href="/contact" className="inline-flex w-fit items-center gap-6 rounded-full bg-[#f7f7f2] px-6 py-4 text-sm font-semibold text-primary">Start a conversation <ArrowRight size={18} /></Link></div></section>
  </main>;
}
