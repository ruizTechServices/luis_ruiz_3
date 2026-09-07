import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";
export function pageMetadata(title: string, description: string, path: string, imagePath = "/opengraph-image"): Metadata {
  return { title, description,
    alternates: { canonical: absoluteUrl(path), types: { "application/rss+xml": absoluteUrl("/feed.xml") } },
    openGraph: { title: `${title} | Luis Ruiz`, description, url: absoluteUrl(path), siteName: "Luis Ruiz", type: "website", images: [{ url: absoluteUrl(imagePath), width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(imagePath)] },
  };
}
