import { DashboardTablePage } from "@/components/data/dashboard-table-page";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardClientsPage() {
  const user = await requireUser();

  return <DashboardTablePage slug="clients" user={user} />;
}
