import { DashboardTablePage } from "@/components/data/dashboard-table-page";
import { WriterShortcut } from "@/components/dashboard/writer-shortcut";
import { isGioAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLinksPage() {
  const user = await requireUser();
  const isAdmin = await isGioAdmin();

  return (
    <>
      {isAdmin ? <div className="mx-auto w-full max-w-5xl px-6 pt-12"><WriterShortcut /><Link href="/dashboard/media" className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40"><ImagePlus className="size-6 shrink-0 text-primary" /><div><h2 className="font-medium">Your images</h2><p className="mt-1 text-sm text-muted-foreground">Upload a project screenshot or copy an image into a story.</p></div></Link></div> : null}
      <DashboardTablePage slug="links" user={user} />
    </>
  );
}
import Link from "next/link";
import { ImagePlus } from "lucide-react";
