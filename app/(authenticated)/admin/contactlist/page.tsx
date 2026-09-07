import { redirect } from "next/navigation";
import { requireGioAdmin } from "@/lib/auth/admin";

export default async function AdminContactListPage() {
  await requireGioAdmin();
  redirect("/dashboard/inquiries");
}
