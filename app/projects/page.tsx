import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { getProjects } from "@/lib/public-content/data";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata("Projects", "Explore websites, tools, and experiments by Luis Ruiz, with live links and the thinking behind the work.", "/projects");
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <main id="main-content" className="site-container py-16 sm:py-20"><p className="eyebrow mb-4">The portfolio</p><h1 className="font-display text-5xl sm:text-7xl">Work you can explore.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Websites, independent projects, and experiments. Open a project to see its purpose, the decisions behind it, and where it stands.</p><div className="mt-12 grid gap-6 md:grid-cols-3">{projects.map((project,index) => <ProjectCard key={project.id} project={project} index={index} />)}</div><div className="mt-14 flex flex-wrap items-center justify-between gap-5 border-t border-border pt-8"><p className="font-display text-2xl">Have a problem worth working on?</p><Link href="/contact" className="text-link">Let’s talk about it <ArrowUpRight size={18} /></Link></div></main>;
}
