-- Roll back the application before running this file. Export or deliberately
-- publish private drafts first. This rollback refuses to expose private writing.
begin;
lock table public.blog_posts in access exclusive mode;
do $$
begin
  if exists (select 1 from public.blog_posts where status = 'draft') then
    raise exception 'Rollback refused: private drafts exist. Export them and resolve their visibility before removing draft protection.';
  end if;
end;
$$;

drop policy if exists comments_visible_story_select on public.comments;
drop policy if exists comments_visible_story_insert on public.comments;
drop policy if exists comments_visible_story_update on public.comments;
drop policy if exists votes_visible_story_select on public.votes;
drop policy if exists votes_visible_story_insert on public.votes;
drop policy if exists votes_visible_story_update on public.votes;

drop policy if exists blog_posts_published_select on public.blog_posts;
drop policy if exists blog_posts_owner_or_published_select on public.blog_posts;
create policy blog_posts_public_select on public.blog_posts for select to anon, authenticated using (true);

create or replace function public.get_blog_posts_with_stats()
returns table (
  id bigint, created_at timestamptz, title text, summary text, tags text,
  "references" text, body text, comment_count bigint, up_votes bigint, down_votes bigint
)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.created_at, p.title, p.summary, p.tags, p."references", p.body,
    coalesce(comment_stats.count, 0)::bigint,
    coalesce(vote_stats.up_count, 0)::bigint,
    coalesce(vote_stats.down_count, 0)::bigint
  from public.blog_posts p
  left join lateral (select count(*) as count from public.comments c where c.post_id = p.id) as comment_stats on true
  left join lateral (
    select count(*) filter (where v.vote_type = 'up') as up_count,
      count(*) filter (where v.vote_type = 'down') as down_count
    from public.votes v where v.post_id = p.id
  ) as vote_stats on true
  order by p.created_at desc;
$$;

drop trigger if exists blog_posts_story_timestamps on public.blog_posts;
drop function if exists public.set_blog_story_timestamps();
drop index if exists public.blog_posts_published_at_idx;
alter table public.blog_posts
  drop constraint blog_posts_publication_date_check,
  drop constraint blog_posts_status_check,
  drop column status,
  drop column published_at,
  drop column updated_at;
commit;
