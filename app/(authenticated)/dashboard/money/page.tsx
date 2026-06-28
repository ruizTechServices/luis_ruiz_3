import { DashboardTablePage } from "@/components/data/dashboard-table-page";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardMoneyPage() {
  const user = await requireUser();

  return <DashboardTablePage slug="money" user={user} />;
}
