import Link from "next/link";

import {
  PortfolioCard,
  PortfolioCardContent,
  PortfolioCardDescription,
  PortfolioCardHeader,
  PortfolioCardTitle,
} from "@/components/home/portfolio-card";
import { Button } from "@/components/ui/button";
import { firstParagraph, formatDate } from "@/lib/data/format";
import { getBlogPosts } from "@/lib/public-content/data";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Blog</h1>
        <p className="text-sm text-muted-foreground">Public notes and articles from the database.</p>
      </section>
      <section className="grid gap-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PortfolioCard className="max-w-none" key={post.id}>
              <PortfolioCardHeader>
                <PortfolioCardTitle>{post.title ?? `Post ${post.id}`}</PortfolioCardTitle>
                <PortfolioCardDescription>
                  {formatDate(post.created_at)} | {post.comment_count} comments | {post.up_votes} up |{" "}
                  {post.down_votes} down
                </PortfolioCardDescription>
              </PortfolioCardHeader>
              <PortfolioCardContent>
                <p className="mb-4 text-muted-foreground">{firstParagraph(post.summary)}</p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/blog/${post.id}`}>Read</Link>
                </Button>
              </PortfolioCardContent>
            </PortfolioCard>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No blog posts yet.</p>
        )}
      </section>
    </main>
  );
}
