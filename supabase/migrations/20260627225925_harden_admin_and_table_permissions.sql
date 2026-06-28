-- Harden public-schema grants and RLS around the verified Google OAuth admin.
-- Admin identity is stateless: lower(auth.email()) = 'giosterr44@gmail.com'.

create or replace function public.is_gio_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    lower((select auth.email())) = 'giosterr44@gmail.com',
    false
  );
$$;

revoke all on function public.is_gio_admin() from public, anon, authenticated;
grant execute on function public.is_gio_admin() to authenticated;

-- Keep trigger functions off the public RPC surface and pin search_path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, user_id, email, full_name, role)
  values (
    extensions.gen_random_uuid(),
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user'
  );

  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.get_next_chat_id()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  next_id integer;
begin
  update public.chat_counter
  set last_chat_id = last_chat_id + 1
  returning last_chat_id into next_id;

  return next_id;
end;
$$;

create or replace function public.next_chat_id()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  next_id integer;
begin
  update public.chat_counter
  set last_chat_id = last_chat_id + 1
  where id = 1
  returning last_chat_id into next_id;

  if next_id is null then
    insert into public.chat_counter (id, last_chat_id)
    values (1, 1)
    on conflict (id) do update
      set last_chat_id = excluded.last_chat_id
    returning last_chat_id into next_id;
  end if;

  return next_id;
end;
$$;

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
security invoker
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

create or replace function public.match_chat_embeddings(
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count integer
)
returns table (
  id bigint,
  chat_id integer,
  role text,
  message text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = 'extensions'
as $$
  select
    chat_embeddings.id,
    chat_embeddings.chat_id::integer,
    chat_embeddings.role,
    chat_embeddings.message,
    1 - (chat_embeddings.embedding <=> query_embedding) as similarity
  from public.chat_embeddings
  where chat_embeddings.user_id = (select auth.uid())
    and chat_embeddings.embedding is not null
    and 1 - (chat_embeddings.embedding <=> query_embedding) > match_threshold
  order by chat_embeddings.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

create or replace function public.match_chat_messages(
  query_embedding extensions.vector,
  match_threshold double precision,
  max_results integer
)
returns table (
  chat_id integer,
  message text,
  created_at timestamp with time zone,
  similarity double precision
)
language sql
stable
security invoker
set search_path = 'extensions'
as $$
  select
    chat_messages.chat_id,
    chat_messages.message,
    chat_messages.created_at,
    1 - (chat_messages.embedding <=> query_embedding) as similarity
  from public.chat_messages
  where chat_messages.user_id = (select auth.uid())
    and chat_messages.embedding is not null
    and 1 - (chat_messages.embedding <=> query_embedding) > match_threshold
  order by chat_messages.embedding <=> query_embedding
  limit least(greatest(max_results, 1), 50);
$$;

create or replace function public.match_documents(
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count integer
)
returns table (
  id bigint,
  content text,
  title text,
  source text,
  url text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = 'extensions'
as $$
  select
    documents.id,
    documents.content,
    documents.title,
    documents.source,
    documents.url,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where (select public.is_gio_admin())
    and documents.embedding is not null
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

create or replace function public.match_gios_context(
  query_embedding extensions.vector,
  match_count integer default 5,
  min_similarity double precision default null::double precision
)
returns table (
  id bigint,
  content text,
  role text,
  session_id integer,
  message_id bigint,
  similarity double precision
)
language sql
stable
security invoker
set search_path = 'extensions'
as $$
  select
    gios_context.id,
    gios_context.content,
    gios_context.role,
    gios_context.session_id,
    gios_context.message_id,
    1 - (gios_context.embedding <=> query_embedding) as similarity
  from public.gios_context
  where (select public.is_gio_admin())
    and gios_context.embedding is not null
    and (
      min_similarity is null
      or 1 - (gios_context.embedding <=> query_embedding) >= min_similarity
    )
  order by gios_context.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 50);
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.get_next_chat_id() from public, anon, authenticated;
revoke all on function public.next_chat_id() from public, anon, authenticated;
revoke all on function public.match_chat_embeddings(extensions.vector, double precision, integer) from public, anon, authenticated;
revoke all on function public.match_chat_messages(extensions.vector, double precision, integer) from public, anon, authenticated;
revoke all on function public.match_documents(extensions.vector, double precision, integer) from public, anon, authenticated;
revoke all on function public.match_gios_context(extensions.vector, integer, double precision) from public, anon, authenticated;

grant execute on function public.get_blog_posts_with_stats() to anon, authenticated;
grant execute on function public.match_chat_embeddings(extensions.vector, double precision, integer) to authenticated;
grant execute on function public.match_chat_messages(extensions.vector, double precision, integer) to authenticated;
grant execute on function public.match_documents(extensions.vector, double precision, integer) to authenticated;
grant execute on function public.match_gios_context(extensions.vector, integer, double precision) to authenticated;

alter table public.conversations alter column user_id set default auth.uid();
alter table public.chat_messages alter column user_id set default auth.uid();
alter table public.chat_embeddings alter column user_id set default auth.uid();
alter table public.round_robin_sessions alter column user_id set default auth.uid();

create index if not exists user_profiles_user_id_idx
  on public.user_profiles (user_id);

create index if not exists dashboard_decisions_project_id_idx
  on public.dashboard_decisions (project_id);

create index if not exists dashboard_money_entries_project_id_idx
  on public.dashboard_money_entries (project_id);

create index if not exists dashboard_money_entries_client_id_idx
  on public.dashboard_money_entries (client_id);

alter table public.blog_posts enable row level security;
alter table public.chat_embeddings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.comments enable row level security;
alter table public.contactlist enable row level security;
alter table public.conversations enable row level security;
alter table public.dashboard_clients enable row level security;
alter table public.dashboard_decisions enable row level security;
alter table public.dashboard_leads enable row level security;
alter table public.dashboard_money_entries enable row level security;
alter table public.dashboard_projects enable row level security;
alter table public.dashboard_system_links enable row level security;
alter table public.documents enable row level security;
alter table public.gios_context enable row level security;
alter table public.journal enable row level security;
alter table public.project_blog_links enable row level security;
alter table public.projects enable row level security;
alter table public.round_robin_messages enable row level security;
alter table public.round_robin_sessions enable row level security;
alter table public.site_settings enable row level security;
alter table public.todos enable row level security;
alter table public.user_profiles enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Admin can manage posts" on public.blog_posts;
drop policy if exists "Public can read posts" on public.blog_posts;
drop policy if exists "User owns their embeddings" on public.chat_embeddings;
drop policy if exists "User owns their messages" on public.chat_messages;
drop policy if exists "Authenticated can create comments" on public.comments;
drop policy if exists "Owner or admin can delete comments" on public.comments;
drop policy if exists "Owner or admin can modify comments" on public.comments;
drop policy if exists "Public can read comments" on public.comments;
drop policy if exists "Admin full access to contacts" on public.contactlist;
drop policy if exists "Public can insert contacts" on public.contactlist;
drop policy if exists "User owns their conversations" on public.conversations;
drop policy if exists "Admin only documents" on public.documents;
drop policy if exists "Admin only gios_context" on public.gios_context;
drop policy if exists "Enable insert for authenticated users only" on public.journal;
drop policy if exists "Enable read access for authenticated users" on public.journal;
drop policy if exists "project_blog_links_read_all" on public.project_blog_links;
drop policy if exists "Giosterr44 can insert into projects" on public.projects;
drop policy if exists "Giosterr44 can update projects" on public.projects;
drop policy if exists "public_projects_select" on public.projects;
drop policy if exists "Giosterr44 can insert site_settings" on public.site_settings;
drop policy if exists "Giosterr44 can update site_settings" on public.site_settings;
drop policy if exists "Public read site settings" on public.site_settings;
drop policy if exists "insert_user_profiles" on public.user_profiles;
drop policy if exists "select_user_profiles" on public.user_profiles;
drop policy if exists "update_user_profiles" on public.user_profiles;
drop policy if exists "Authenticated can vote" on public.votes;
drop policy if exists "Owner or admin can change vote" on public.votes;
drop policy if exists "Owner or admin can delete vote" on public.votes;
drop policy if exists "Public can read votes" on public.votes;

-- Public-read content; Gio-only writes.
create policy blog_posts_public_select
on public.blog_posts
for select
to anon, authenticated
using (true);

create policy blog_posts_gio_insert
on public.blog_posts
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy blog_posts_gio_update
on public.blog_posts
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy blog_posts_gio_delete
on public.blog_posts
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy projects_public_select
on public.projects
for select
to anon, authenticated
using (true);

create policy projects_gio_insert
on public.projects
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy projects_gio_update
on public.projects
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy projects_gio_delete
on public.projects
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy project_blog_links_public_select
on public.project_blog_links
for select
to anon, authenticated
using (true);

create policy project_blog_links_gio_insert
on public.project_blog_links
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy project_blog_links_gio_update
on public.project_blog_links
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy project_blog_links_gio_delete
on public.project_blog_links
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy site_settings_public_select
on public.site_settings
for select
to anon, authenticated
using (true);

create policy site_settings_gio_insert
on public.site_settings
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy site_settings_gio_update
on public.site_settings
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy site_settings_gio_delete
on public.site_settings
for delete
to authenticated
using ((select public.is_gio_admin()));

-- Public contact intake; only Gio can read or manage submissions.
create policy contactlist_public_insert
on public.contactlist
for insert
to anon, authenticated
with check (true);

create policy contactlist_gio_select
on public.contactlist
for select
to authenticated
using ((select public.is_gio_admin()));

create policy contactlist_gio_update
on public.contactlist
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy contactlist_gio_delete
on public.contactlist
for delete
to authenticated
using ((select public.is_gio_admin()));

-- Public engagement reads; signed-in users create; Gio moderates.
create policy comments_public_select
on public.comments
for select
to anon, authenticated
using (true);

create policy comments_authenticated_insert
on public.comments
for insert
to authenticated
with check (
  lower(user_email) = lower((select auth.email()))
);

create policy comments_gio_update
on public.comments
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy comments_gio_delete
on public.comments
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy votes_public_select
on public.votes
for select
to anon, authenticated
using (true);

create policy votes_authenticated_insert
on public.votes
for insert
to authenticated
with check (
  lower(user_email) = lower((select auth.email()))
);

create policy votes_gio_update
on public.votes
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy votes_gio_delete
on public.votes
for delete
to authenticated
using ((select public.is_gio_admin()));

-- Gio-only admin/vector tables.
create policy documents_gio_select
on public.documents
for select
to authenticated
using ((select public.is_gio_admin()));

create policy documents_gio_insert
on public.documents
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy documents_gio_update
on public.documents
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy documents_gio_delete
on public.documents
for delete
to authenticated
using ((select public.is_gio_admin()));

create policy gios_context_gio_select
on public.gios_context
for select
to authenticated
using ((select public.is_gio_admin()));

create policy gios_context_gio_insert
on public.gios_context
for insert
to authenticated
with check ((select public.is_gio_admin()));

create policy gios_context_gio_update
on public.gios_context
for update
to authenticated
using ((select public.is_gio_admin()))
with check ((select public.is_gio_admin()));

create policy gios_context_gio_delete
on public.gios_context
for delete
to authenticated
using ((select public.is_gio_admin()));

-- Authenticated-only miscellaneous tables.
create policy journal_authenticated_select
on public.journal
for select
to authenticated
using (true);

create policy journal_authenticated_insert
on public.journal
for insert
to authenticated
with check (true);

create policy todos_authenticated_select
on public.todos
for select
to authenticated
using (true);

create policy todos_authenticated_insert
on public.todos
for insert
to authenticated
with check (true);

create policy todos_authenticated_update
on public.todos
for update
to authenticated
using (true)
with check (true);

create policy todos_authenticated_delete
on public.todos
for delete
to authenticated
using (true);

-- User-owned legacy AI tables.
create policy conversations_owner_select
on public.conversations
for select
to authenticated
using (user_id = (select auth.uid()));

create policy conversations_owner_insert
on public.conversations
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy conversations_owner_update
on public.conversations
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy conversations_owner_delete
on public.conversations
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy chat_messages_owner_select
on public.chat_messages
for select
to authenticated
using (user_id = (select auth.uid()));

create policy chat_messages_owner_insert
on public.chat_messages
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy chat_messages_owner_update
on public.chat_messages
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy chat_messages_owner_delete
on public.chat_messages
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy chat_embeddings_owner_select
on public.chat_embeddings
for select
to authenticated
using (user_id = (select auth.uid()));

create policy chat_embeddings_owner_insert
on public.chat_embeddings
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy chat_embeddings_owner_update
on public.chat_embeddings
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy chat_embeddings_owner_delete
on public.chat_embeddings
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy round_robin_sessions_owner_select
on public.round_robin_sessions
for select
to authenticated
using (user_id = (select auth.uid()));

create policy round_robin_sessions_owner_insert
on public.round_robin_sessions
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy round_robin_sessions_owner_update
on public.round_robin_sessions
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy round_robin_sessions_owner_delete
on public.round_robin_sessions
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy round_robin_messages_owner_select
on public.round_robin_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.round_robin_sessions
    where round_robin_sessions.id = round_robin_messages.session_id
      and round_robin_sessions.user_id = (select auth.uid())
  )
);

create policy round_robin_messages_owner_insert
on public.round_robin_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.round_robin_sessions
    where round_robin_sessions.id = round_robin_messages.session_id
      and round_robin_sessions.user_id = (select auth.uid())
  )
);

create policy round_robin_messages_owner_update
on public.round_robin_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.round_robin_sessions
    where round_robin_sessions.id = round_robin_messages.session_id
      and round_robin_sessions.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.round_robin_sessions
    where round_robin_sessions.id = round_robin_messages.session_id
      and round_robin_sessions.user_id = (select auth.uid())
  )
);

create policy round_robin_messages_owner_delete
on public.round_robin_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.round_robin_sessions
    where round_robin_sessions.id = round_robin_messages.session_id
      and round_robin_sessions.user_id = (select auth.uid())
  )
);

-- Profiles: own-row read, safe-column update only through grants.
create policy user_profiles_owner_select
on public.user_profiles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy user_profiles_owner_update
on public.user_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Table grants: make Data API exposure explicit.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.blog_posts,
  public.comments,
  public.project_blog_links,
  public.projects,
  public.site_settings,
  public.votes
to anon, authenticated;

grant insert on public.contactlist to anon, authenticated;

grant select, insert, update, delete on public.blog_posts,
  public.chat_embeddings,
  public.chat_messages,
  public.comments,
  public.contactlist,
  public.conversations,
  public.dashboard_clients,
  public.dashboard_decisions,
  public.dashboard_leads,
  public.dashboard_money_entries,
  public.dashboard_projects,
  public.dashboard_system_links,
  public.documents,
  public.gios_context,
  public.project_blog_links,
  public.projects,
  public.round_robin_messages,
  public.round_robin_sessions,
  public.site_settings,
  public.todos,
  public.votes
to authenticated;

grant select, insert on public.journal to authenticated;

grant select on public.user_profiles to authenticated;
grant update (
  full_name,
  phone,
  address,
  username,
  profile_pic_url,
  bio,
  birth_date
) on public.user_profiles to authenticated;

grant usage on sequence public.contactlist_id_seq to anon, authenticated;

grant usage on sequence public.blog_posts_id_seq,
  public.chat_embeddings_id_seq,
  public.chat_messages_id_seq,
  public.comments_id_seq,
  public.documents_id_seq,
  public.gios_context_id_seq,
  public.journal_id_seq,
  public.project_blog_links_id_seq,
  public.projects_id_seq,
  public.round_robin_messages_id_seq,
  public.round_robin_sessions_id_seq,
  public.site_settings_id_seq,
  public.todos_id_seq,
  public.votes_id_seq
to authenticated;

-- Storage policies: public photo reads, Gio-only photo writes, owner-scoped profile pictures.
drop policy if exists "Authenticated users can delete from photos bucket" on storage.objects;
drop policy if exists "Authenticated users can update in photos bucket" on storage.objects;
drop policy if exists "Authenticated users can upload to photos bucket" on storage.objects;
drop policy if exists "Give users authenticated access to folder kidofz_0" on storage.objects;
drop policy if exists "Public read access for photos bucket" on storage.objects;
drop policy if exists "photos_public_select" on storage.objects;
drop policy if exists "photos_gio_insert" on storage.objects;
drop policy if exists "photos_gio_update" on storage.objects;
drop policy if exists "photos_gio_delete" on storage.objects;
drop policy if exists "user_profile_pictures_owner_select" on storage.objects;
drop policy if exists "user_profile_pictures_owner_insert" on storage.objects;
drop policy if exists "user_profile_pictures_owner_update" on storage.objects;
drop policy if exists "user_profile_pictures_owner_delete" on storage.objects;

create policy photos_public_select
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'photos');

create policy photos_gio_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'photos'
  and (select public.is_gio_admin())
);

create policy photos_gio_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'photos'
  and (select public.is_gio_admin())
)
with check (
  bucket_id = 'photos'
  and (select public.is_gio_admin())
);

create policy photos_gio_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'photos'
  and (select public.is_gio_admin())
);

create policy user_profile_pictures_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'user_profile_pictures'
  and owner = (select auth.uid())
);

create policy user_profile_pictures_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user_profile_pictures'
  and owner = (select auth.uid())
);

create policy user_profile_pictures_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'user_profile_pictures'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'user_profile_pictures'
  and owner = (select auth.uid())
);

create policy user_profile_pictures_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user_profile_pictures'
  and owner = (select auth.uid())
);
