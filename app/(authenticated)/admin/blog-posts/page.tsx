import { redirect } from "next/navigation";

import { requireGioAdmin } from "@/lib/auth/admin";

export default async function AdminBlogPostsPage() {
  await requireGioAdmin();
  redirect("/dashboard/write");
}
