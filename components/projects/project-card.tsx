import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Code2, Globe2, MessageSquare } from "lucide-react";
import { getProjectEvidence } from "@/components/projects/project-evidence-data";
import type { Project } from "@/lib/public-content/data";

export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const Icon = project.slug.includes("chuef") ? MessageSquare : project.slug.includes("ruiztech") ? Code2 : Globe2;
  const screenshot = getProjectEvidence(project.id)?.screenshots[0];
  return <article className="project-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
    <Link href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true" className={`project-art project-art-${index % 3} relative flex h-52 items-center justify-center overflow-hidden border-b border-border`}>
      {screenshot ? <><Image src={screenshot.src} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.025]" /><span className="absolute bottom-3 right-4 rounded-full border border-border bg-background/95 px-3 py-1 font-mono text-[9px] uppercase tracking-widest">Live product screenshot</span></> : <><div className="absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[.16em] opacity-60">{project.slug === "ruiztechservices-" ? "Independent business" : project.category === "experiment" ? "Independent experiment" : "Web project"}</div>
      <div className="w-[75%] rounded-lg border border-current/15 bg-white/75 p-4 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
        <div className="mb-5 flex gap-1.5"><span className="size-1.5 rounded-full bg-current/30" /><span className="size-1.5 rounded-full bg-current/20" /><span className="size-1.5 rounded-full bg-current/10" /></div>
        <Icon size={23} strokeWidth={1.4} className="mb-3" /><p className="text-lg font-semibold tracking-tight">{project.title}</p>
        <div className="mt-4 flex gap-2"><span className="h-1 w-20 rounded bg-current/20" /><span className="h-1 w-10 rounded bg-current/10" /></div>
      </div>
      <span className="absolute bottom-3 right-4 font-mono text-[9px] uppercase tracking-widest opacity-50">Project identity</span></>}
    </Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="eyebrow mb-3">{project.slug === "ruiztechservices-" ? "My business" : project.category === "experiment" ? "Experiment" : "Website"}</p>
      <h3 className="text-xl font-semibold tracking-tight"><Link href={`/projects/${project.slug}`} className="hover:text-primary">{project.title ?? project.slug}</Link></h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{project.summary ?? project.description}</p>
      {project.stack?.length ? <div className="mt-5 flex flex-wrap gap-2">{project.stack.slice(0,4).map(item => <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px]" key={item}>{item}</span>)}</div> : null}
      <Link href={`/projects/${project.slug}`} className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">Explore the project <ArrowUpRight size={17} /></Link>
    </div>
  </article>;
}
