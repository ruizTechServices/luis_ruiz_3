import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/account", "/login", "/auth/", "/api/"] }, sitemap: absoluteUrl("/sitemap.xml") };
}
