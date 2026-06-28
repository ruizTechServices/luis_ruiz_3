import { formatDate } from "@/lib/data/format";
import { getBlogPost } from "@/lib/public-content/data";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { post, comments, upVotes, downVotes } = await getBlogPost(id);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl content-start gap-8 px-6 py-16">
      <article className="grid gap-4">
        <p className="text-sm text-muted-foreground">{formatDate(post.created_at)}</p>
        <h1 className="text-3xl font-semibold tracking-normal">{post.title ?? `Post ${post.id}`}</h1>
        {post.summary ? <p className="text-muted-foreground">{post.summary}</p> : null}
        <div className="whitespace-pre-wrap text-sm leading-7">{post.body ?? "No body yet."}</div>
        {post.references ? (
          <p className="text-xs text-muted-foreground">References: {post.references}</p>
        ) : null}
        {post.tags ? <p className="text-xs text-muted-foreground">Tags: {post.tags}</p> : null}
      </article>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-normal">Engagement</h2>
        <p className="text-sm text-muted-foreground">
          {upVotes} up votes, {downVotes} down votes, {comments.length} comments
        </p>
        <div className="grid gap-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <article className="rounded-md border border-border p-4" key={comment.id}>
                <p className="text-sm">{comment.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {comment.user_email ?? "Unknown"} | {formatDate(comment.created_at)}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
