import Link from "next/link";

import { navLinks } from "@/lib/navigation/nav-links";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isGioAdmin } from "@/lib/auth/admin";

export async function SiteNavbar() {
  const user = await getAuthenticatedUser();
  const isAuthenticated = Boolean(user);
  const isAdmin = user ? await isGioAdmin() : false;
  const visibleLinks = navLinks.filter((link) => {
    if (link.visibility === "always") {
      return true;
    }

    if (link.visibility === "admin") {
      return isAdmin;
    }

    return link.visibility === "authenticated" ? isAuthenticated : !isAuthenticated;
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex min-h-14 w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <Link
          aria-label="Go to home page"
          className="text-sm font-semibold tracking-normal text-foreground"
          href="/"
        >
          Luis Ruiz
        </Link>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
          {visibleLinks.map((link) => (
            <Link
              aria-label={link.ariaLabel}
              className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
