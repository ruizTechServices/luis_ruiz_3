import Link from "next/link";
import { AudioLines, ChartNoAxesCombined, ImagePlus, Inbox } from "lucide-react";

import { DashboardTablePage } from "@/components/data/dashboard-table-page";
import { WriterShortcut } from "@/components/dashboard/writer-shortcut";
import { isGioAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";

const ownerLinks = [
  { href: "/dashboard/inquiries", title: "Your inquiry inbox", description: "Review project notes, update their status, and plan a follow-up.", icon: Inbox },
  { href: "/dashboard/insights", title: "Your site insights", description: "See which projects attract attention and where inquiries begin.", icon: ChartNoAxesCombined },
  { href: "/dashboard/soundboard", title: "Your soundboard", description: "Add a sound, change its label, or publish a clip.", icon: AudioLines },
  { href: "/dashboard/media", title: "Your images", description: "Upload a project screenshot or copy an image into a story.", icon: ImagePlus },
];

export default async function DashboardLinksPage() {
  const user = await requireUser();
  const isAdmin = await isGioAdmin();

  return (
    <>
      {isAdmin ? <div className="mx-auto w-full max-w-5xl px-6 pt-12"><WriterShortcut /><nav aria-label="Your publishing and business tools" className="mt-4 grid gap-3 sm:grid-cols-2">{ownerLinks.map(({ href, title, description, icon: Icon }) => <Link key={href} href={href} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40"><Icon aria-hidden="true" className="size-6 shrink-0 text-primary" /><div><h2 className="font-medium">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div></Link>)}</nav></div> : null}
      <DashboardTablePage slug="links" user={user} />
    </>
  );
}
