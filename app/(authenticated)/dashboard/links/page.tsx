import { DashboardTablePage } from "@/components/data/dashboard-table-page";
import { WriterShortcut } from "@/components/dashboard/writer-shortcut";
import { isGioAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLinksPage() {
  const user = await requireUser();
  const isAdmin = await isGioAdmin();

  return (
    <>
      {isAdmin ? <div className="mx-auto w-full max-w-5xl px-6 pt-12"><WriterShortcut /></div> : null}
      <DashboardTablePage slug="links" user={user} />
    </>
  );
}
