create or replace function public.get_blog_posts_with_stats()
returns table (
  id bigint,
  created_at timestamp with time zone,
  title text,
  summary text,
  tags text,
  "references" text,
  body text,
  comment_count bigint,
  up_votes bigint,
  down_votes bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.blog_posts.id,
    public.blog_posts.created_at,
    public.blog_posts.title,
    public.blog_posts.summary,
    public.blog_posts.tags,
    public.blog_posts."references",
    public.blog_posts.body,
    coalesce(comment_stats.count, 0)::bigint as comment_count,
    coalesce(vote_stats.up_count, 0)::bigint as up_votes,
    coalesce(vote_stats.down_count, 0)::bigint as down_votes
  from public.blog_posts
  left join lateral (
    select count(*) as count
    from public.comments
    where public.comments.post_id = public.blog_posts.id
  ) as comment_stats on true
  left join lateral (
    select
      count(*) filter (where public.votes.vote_type = 'up') as up_count,
      count(*) filter (where public.votes.vote_type = 'down') as down_count
    from public.votes
    where public.votes.post_id = public.blog_posts.id
  ) as vote_stats on true
  order by public.blog_posts.created_at desc;
$$;

revoke all on function public.get_blog_posts_with_stats() from public;
grant execute on function public.get_blog_posts_with_stats() to anon, authenticated;
