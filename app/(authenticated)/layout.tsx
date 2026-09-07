import type { Metadata } from "next";
import { AuthenticatedMarker } from "@/components/auth/authenticated-marker";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();

  return (
    <>
      <AuthenticatedMarker />
      {children}
    </>
  );
}
