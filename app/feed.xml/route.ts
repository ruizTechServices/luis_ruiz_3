import { getBlogPosts } from "@/lib/public-content/data";
import { absoluteUrl } from "@/lib/seo/site-url";
const xml = (value:string|null) => (value ?? "").replace(/[<>&"']/g, char => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[char]!));
export async function GET() {
  const posts=await getBlogPosts({limit:30});
  const body=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Luis Ruiz — Writing &amp; Build Notes</title><link>${xml(absoluteUrl("/blog"))}</link><description>Build notes, experiments, and ideas by Luis Ruiz.</description><language>en-us</language>${posts.map(post=>`<item><title>${xml(post.title)}</title><link>${xml(absoluteUrl(`/blog/${post.id}`))}</link><guid isPermaLink="true">${xml(absoluteUrl(`/blog/${post.id}`))}</guid><description>${xml(post.summary)}</description><pubDate>${new Date(post.published_at ?? post.created_at).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`;
  return new Response(body,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=60"}});
}
