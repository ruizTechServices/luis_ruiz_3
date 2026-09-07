create table public.soundboard_clips (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  label text not null check (char_length(btrim(label)) between 1 and 70),
  source_path text not null unique,
  hotkey text not null default '',
  category text not null default 'Reactions' check (category in ('Reactions', 'Comedy', 'Effects')),
  duration_seconds double precision not null check (duration_seconds >= 0.05 and duration_seconds <= 60),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  daily_pick boolean not null default true,
  is_original boolean not null default false,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint soundboard_source_shape check (
    (is_original and source_path ~ '^/sounds/[A-Za-z0-9_.-]+[.]mp3$' and hotkey ~ '^[1-9QWERTYU]$')
    or (not is_original and id ~ '^sound-[a-f0-9-]{36}$' and source_path ~ '^clips/[a-f0-9-]{36}[.](mp3|wav)$' and hotkey = '')
  )
);
create unique index soundboard_original_hotkeys on public.soundboard_clips (hotkey) where hotkey <> '';
create index soundboard_published_order on public.soundboard_clips (sort_order, created_at) where status = 'published';
alter table public.soundboard_clips enable row level security;
revoke all on public.soundboard_clips from anon, authenticated;
grant select on public.soundboard_clips to anon, authenticated;
grant insert (id, label, source_path, category, duration_seconds, daily_pick) on public.soundboard_clips to authenticated;
grant update (label, category, status, daily_pick, sort_order) on public.soundboard_clips to authenticated;
grant all on public.soundboard_clips to service_role;
create policy "Published sounds are public" on public.soundboard_clips for select to anon, authenticated using (status = 'published');
create policy "Gio can read all sounds" on public.soundboard_clips for select to authenticated using ((select public.is_gio_admin()));
create policy "Gio can add sounds" on public.soundboard_clips for insert to authenticated with check ((select public.is_gio_admin()) and not is_original and status = 'draft');
create policy "Gio can manage sounds" on public.soundboard_clips for update to authenticated using ((select public.is_gio_admin())) with check ((select public.is_gio_admin()));

create function luis_ruiz_private.touch_soundboard_clip() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function luis_ruiz_private.touch_soundboard_clip() from public;
create trigger touch_soundboard_clip before update on public.soundboard_clips for each row execute function luis_ruiz_private.touch_soundboard_clip();

create table public.soundboard_upload_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  hits integer not null check (hits between 1 and 10)
);
alter table public.soundboard_upload_windows enable row level security;
revoke all on public.soundboard_upload_windows from anon, authenticated;
grant select, insert, update on public.soundboard_upload_windows to authenticated;
grant all on public.soundboard_upload_windows to service_role;
create policy "Gio upload quota" on public.soundboard_upload_windows for all to authenticated using ((select public.is_gio_admin()) and user_id = (select auth.uid())) with check ((select public.is_gio_admin()) and user_id = (select auth.uid()));

create function public.reserve_soundboard_upload() returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  if not public.is_gio_admin() then return false; end if;
  insert into public.soundboard_upload_windows (user_id, window_start, hits)
    values (auth.uid(), date_trunc('hour', now()), 1)
  on conflict (user_id) do update set
    window_start = excluded.window_start,
    hits = case when soundboard_upload_windows.window_start < excluded.window_start then 1 else soundboard_upload_windows.hits + 1 end
  where soundboard_upload_windows.window_start < excluded.window_start or soundboard_upload_windows.hits < 10;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
revoke all on function public.reserve_soundboard_upload() from public, anon;
grant execute on function public.reserve_soundboard_upload() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('soundboard-audio', 'soundboard-audio', true, 3145728, array['audio/mpeg', 'audio/wav']);
create policy "Gio uploads soundboard audio" on storage.objects for insert to authenticated with check (bucket_id = 'soundboard-audio' and name ~ '^clips/[a-f0-9-]{36}[.](mp3|wav)$' and (select public.is_gio_admin()));
create policy "Gio lists soundboard audio" on storage.objects for select to authenticated using (bucket_id = 'soundboard-audio' and (select public.is_gio_admin()));

-- The original sound IDs, keyboard shortcuts and immutable file paths remain unchanged.
insert into public.soundboard_clips (id,label,source_path,hotkey,category,duration_seconds,status,daily_pick,is_original,sort_order) values
('vine-boom', 'Vine Boom', '/sounds/vine-boom.mp3', '1', 'Effects', 1.306122, 'published', true, true, 1),
('uwu', 'UwU', '/sounds/uwu.mp3', '2', 'Reactions', 0.72, 'published', true, true, 2),
('stop-the-cap', 'Stop The Cap', '/sounds/stop-the-cap-cut.mp3', '3', 'Reactions', 0.862041, 'published', true, true, 3),
('roblox-oof', 'Roblox Oof', '/sounds/roblox-death-sound_1.mp3', '4', 'Effects', 1.044898, 'published', true, true, 4),
('airhorn', 'MLG Airhorn', '/sounds/mlg-airhorn.mp3', '5', 'Effects', 3.004082, 'published', true, true, 5),
('meow', 'Meow', '/sounds/meow_jEHtSyd.mp3', '6', 'Effects', 0.835918, 'published', true, true, 6),
('mystery-clip', 'Mystery Clip', '/sounds/indian.mp3', '7', 'Comedy', 8.594286, 'published', true, true, 7),
('gulping', 'Gulp', '/sounds/gulping.mp3', '8', 'Comedy', 17.110204, 'published', true, true, 8),
('gigachad', 'Gigachad', '/sounds/gigachad.mp3', '9', 'Comedy', 28.656438, 'published', true, true, 9),
('get-out', 'Get Out', '/sounds/getouttuco.mp3', 'Q', 'Reactions', 1.752, 'published', true, true, 10),
('ewww', 'Ewww', '/sounds/ewww.mp3', 'W', 'Reactions', 3.056327, 'published', true, true, 11),
('dry-fart', 'Dry Fart', '/sounds/dry-fart.mp3', 'E', 'Comedy', 0.365714, 'published', true, true, 12),
('dababy', 'DaBaby', '/sounds/dababy.mp3', 'R', 'Comedy', 3.696, 'published', true, true, 13),
('bruh', 'Bruh', '/sounds/bruh.mp3', 'T', 'Reactions', 0.336, 'published', true, true, 14),
('anime-wow', 'Anime Wow', '/sounds/anime-wow-sound-effect.mp3', 'Y', 'Reactions', 4.205714, 'published', true, true, 15),
('fah', 'Fahhhhh', '/sounds/fahhhhhhhhhhhhhh.mp3', 'U', 'Reactions', 1.959184, 'published', true, true, 16);
