import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { articleDate, readingMinutes } from "@/lib/content/format";
import type { BlogPost } from "@/lib/public-content/data";
export function PostList({ posts }: { posts: BlogPost[] }) {
  return <div className="divide-y divide-border border-y border-border">{posts.map(post => <article key={post.id} className="group grid gap-4 py-7 md:grid-cols-[150px_1fr_30px] md:gap-8">
    <div className="text-xs leading-6 text-muted-foreground"><time dateTime={post.published_at ?? post.created_at}>{articleDate(post.published_at ?? post.created_at)}</time><p>{readingMinutes(post.body)} min read</p></div>
    <div><p className="eyebrow mb-2">{post.tags?.split(",")[0]?.trim() || "Thoughts & notes"}</p><h3 className="text-xl font-medium leading-snug tracking-tight sm:text-2xl"><Link href={`/blog/${post.id}`} className="hover:text-primary">{post.title}</Link></h3><p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-7 text-muted-foreground">{post.summary}</p></div>
    <Link href={`/blog/${post.id}`} aria-label={`Read ${post.title}`} className="hidden self-center text-primary md:block"><ArrowUpRight size={22} /></Link>
  </article>)}</div>;
}
