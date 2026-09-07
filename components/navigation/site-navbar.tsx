import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { navLinks } from "@/lib/navigation/nav-links";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isGioAdmin } from "@/lib/auth/admin";
export async function SiteNavbar() {
  const user = await getAuthenticatedUser();
  const isAuthenticated = Boolean(user);
  const isAdmin = user ? await isGioAdmin() : false;
  const visibleLinks = navLinks.filter(link => {
    if (link.visibility === "always") return true;
    if (link.visibility === "admin") return isAdmin;
    return link.visibility === "authenticated" ? isAuthenticated : !isAuthenticated;
  });
  return <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-background focus:p-3">Skip to content</a>
    <nav aria-label="Primary navigation" className="site-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-4">
      <Link aria-label="Go to home page" className="flex items-center gap-3" href="/"><span className="font-display text-3xl italic tracking-tighter text-primary">lr.</span><span className="text-sm font-semibold tracking-tight">Luis Ruiz<span className="hidden font-normal text-muted-foreground lg:inline"> / Developer & builder</span></span></Link>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">{visibleLinks.map(link => <Link aria-label={link.ariaLabel} className={link.href === "/contact" ? "ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground sm:text-sm" : "rounded-full px-2.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3 sm:text-sm"} href={link.href} key={link.href}>{link.label}{link.href === "/contact" ? <ArrowUpRight size={14} /> : null}</Link>)}</div>
    </nav>
  </header>;
}
