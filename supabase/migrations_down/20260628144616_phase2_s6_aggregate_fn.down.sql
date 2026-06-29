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
set search_path = ''
as $$
  select
    blog_posts.id,
    blog_posts.created_at,
    blog_posts.title,
    blog_posts.summary,
    blog_posts.tags,
    blog_posts."references",
    blog_posts.body,
    coalesce(comment_stats.count, 0)::bigint as comment_count,
    coalesce(vote_stats.up_count, 0)::bigint as up_votes,
    coalesce(vote_stats.down_count, 0)::bigint as down_votes
  from public.blog_posts
  left join lateral (
    select count(*) as count
    from public.comments
    where comments.post_id = blog_posts.id
  ) as comment_stats on true
  left join lateral (
    select
      count(*) filter (where vote_type = 'up') as up_count,
      count(*) filter (where vote_type = 'down') as down_count
    from public.votes
    where votes.post_id = blog_posts.id
  ) as vote_stats on true
  order by blog_posts.created_at desc;
$$;

grant execute on function public.get_blog_posts_with_stats() to public, anon, authenticated, service_role;
