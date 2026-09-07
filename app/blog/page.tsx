import Link from "next/link";
import { Rss } from "lucide-react";
import { PostList } from "@/components/content/post-list";
import { getBlogPosts } from "@/lib/public-content/data";
import { pageMetadata } from "@/lib/seo/metadata";
export const metadata = pageMetadata("Writing & Build Notes", "Technical experiments, lessons from building software, and personal notes by Luis Ruiz. Follow the work as it develops.", "/blog");
export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <main id="main-content" className="site-container max-w-5xl py-16 sm:py-20"><p className="eyebrow mb-4">The notebook</p><h1 className="font-display text-5xl sm:text-7xl">Learning out loud.</h1><div className="mb-12 mt-6 flex flex-wrap items-end justify-between gap-5"><p className="max-w-xl text-lg leading-8 text-muted-foreground">Build notes, technical experiments, and ideas from the work. A record of what I’m making—and what I’m learning.</p><Link href="/feed.xml" className="text-link"><Rss size={15}/> Follow via RSS</Link></div>{posts.length ? <PostList posts={posts} /> : <p className="py-8">New writing is on the way.</p>}</main>;
}
