import Image from "next/image";
import Link from "next/link";
export function SiteFooter() {
  return <footer className="mt-auto border-t border-border"><div className="site-container grid gap-8 py-10 sm:grid-cols-[1fr_auto] sm:items-center">
    <div className="flex items-center gap-4"><Image src="/logo-lr.png" alt="Luis Ruiz monogram" width={64} height={64} className="rounded" /><div><p className="text-sm font-medium">Built with purpose. Always in progress.</p><p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()} Luis Ruiz · Bronx, New York</p></div></div>
    <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">{[{label:"About Gio",href:"/about"},{label:"GitHub",href:"https://github.com/ruizTechServices"},{label:"Writing",href:"/blog"},{label:"RSS",href:"/feed.xml"},{label:"Contact",href:"/contact"},{label:"Sitemap",href:"/sitemap"},{label:"My workspace",href:"/dashboard"}].map(link => <Link className="hover:text-primary hover:underline" href={link.href} key={link.href}>{link.label}</Link>)}</nav>
  </div></footer>;
}
