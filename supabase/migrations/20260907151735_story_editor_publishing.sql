begin;

-- Keep legacy stories visible, then make every newly inserted story private by default.
alter table public.blog_posts
  add column status text not null default 'published',
  add column published_at timestamptz,
  add column updated_at timestamptz not null default now();

update public.blog_posts
set published_at = created_at, updated_at = created_at;

alter table public.blog_posts
  alter column status set default 'draft',
  add constraint blog_posts_status_check check (status in ('draft', 'published')),
  add constraint blog_posts_publication_date_check check (status <> 'published' or published_at is not null);

create or replace function public.set_blog_story_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger blog_posts_story_timestamps
before insert or update on public.blog_posts
for each row execute function public.set_blog_story_timestamps();

revoke all on function public.set_blog_story_timestamps() from public, anon, authenticated;

create index blog_posts_published_at_idx
on public.blog_posts (published_at desc, id desc)
where status = 'published';

alter table public.blog_posts enable row level security;
drop policy if exists blog_posts_public_select on public.blog_posts;

-- Separate roles: anon must never need EXECUTE on the owner authorization helper.
create policy blog_posts_published_select
on public.blog_posts for select to anon
using (status = 'published');

create policy blog_posts_owner_or_published_select
on public.blog_posts for select to authenticated
using (status = 'published' or (select public.is_gio_admin()));

-- A withdrawn story also withdraws its comments from public reads.
-- These restrictive policies preserve the existing author/owner mutation rules.
create policy comments_visible_story_select
on public.comments as restrictive for select to anon, authenticated
using (exists (select 1 from public.blog_posts where blog_posts.id = comments.post_id));

create policy comments_visible_story_insert
on public.comments as restrictive for insert to authenticated
with check (exists (select 1 from public.blog_posts where blog_posts.id = comments.post_id));

create policy comments_visible_story_update
on public.comments as restrictive for update to authenticated
using (exists (select 1 from public.blog_posts where blog_posts.id = comments.post_id))
with check (exists (select 1 from public.blog_posts where blog_posts.id = comments.post_id));

create policy votes_visible_story_select
on public.votes as restrictive for select to anon, authenticated
using (exists (select 1 from public.blog_posts where blog_posts.id = votes.post_id));

create policy votes_visible_story_insert
on public.votes as restrictive for insert to authenticated
with check (exists (select 1 from public.blog_posts where blog_posts.id = votes.post_id));

create policy votes_visible_story_update
on public.votes as restrictive for update to authenticated
using (exists (select 1 from public.blog_posts where blog_posts.id = votes.post_id))
with check (exists (select 1 from public.blog_posts where blog_posts.id = votes.post_id));

-- Preserve the existing RPC shape for the old deployment during rollout.
-- Invoker respects table/column grants; publication filter also applies for Gio.
-- Vote totals now reflect only rows visible to the caller; public UI must not label
-- them as global totals while the votes table remains owner-only.
create or replace function public.get_blog_posts_with_stats()
returns table (
  id bigint, created_at timestamptz, title text, summary text, tags text,
  "references" text, body text, comment_count bigint, up_votes bigint, down_votes bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.created_at, p.title, p.summary, p.tags, p."references", p.body,
    coalesce(comment_stats.count, 0)::bigint as comment_count,
    coalesce(vote_stats.up_count, 0)::bigint as up_votes,
    coalesce(vote_stats.down_count, 0)::bigint as down_votes
  from public.blog_posts p
  left join lateral (
    select count(*) as count from public.comments c where c.post_id = p.id
  ) as comment_stats on true
  left join lateral (
    select count(*) filter (where v.vote_type = 'up') as up_count,
      count(*) filter (where v.vote_type = 'down') as down_count
    from public.votes v where v.post_id = p.id
  ) as vote_stats on true
  where p.status = 'published'
  order by p.published_at desc, p.id desc;
$$;

commit;
