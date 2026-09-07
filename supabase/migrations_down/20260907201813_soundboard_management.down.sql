-- Conservative rollback for 20260907201813_soundboard_management.
-- Prefer a forward repair after the owner has used the feature.
-- This script aborts if clips, original metadata or bucket contents have changed.
-- It never deletes audio files and never uses CASCADE.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
lock table public.soundboard_clips in access exclusive mode;
lock table storage.objects in share mode;
lock table storage.buckets in share row exclusive mode;

do $rollback_guard$
begin
  if exists (select 1 from storage.objects where bucket_id = 'soundboard-audio') then
    raise exception 'Rollback refused: uploaded audio exists. Preserve it and use a forward repair.';
  end if;
  if exists (select 1 from public.soundboard_clips where not is_original or updated_at is distinct from created_at) then
    raise exception 'Rollback refused: owner-created clips or edited originals exist. Use a forward repair.';
  end if;
  if exists (
    with expected (id,label,source_path,hotkey,category,duration_seconds,status,daily_pick,is_original,sort_order) as (values
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
('fah', 'Fahhhhh', '/sounds/fahhhhhhhhhhhhhh.mp3', 'U', 'Reactions', 1.959184, 'published', true, true, 16)
    ), expected_rows as (
      select id,label,source_path,hotkey,category,duration_seconds::double precision,status,daily_pick,is_original,sort_order from expected
    ), actual_rows as (
      select id,label,source_path,hotkey,category,duration_seconds,status,daily_pick,is_original,sort_order from public.soundboard_clips
    )
    (select * from expected_rows except select * from actual_rows)
    union all
    (select * from actual_rows except select * from expected_rows)
  ) then
    raise exception 'Rollback refused: the original seeded catalog differs. Use a forward repair.';
  end if;
  if exists (
    select 1 from storage.buckets where id = 'soundboard-audio' and (
      name is distinct from 'soundboard-audio' or public is distinct from true
      or file_size_limit is distinct from 3145728::bigint
      or allowed_mime_types is distinct from array['audio/mpeg', 'audio/wav']::text[]
    )
  ) then
    raise exception 'Rollback refused: soundboard bucket settings have changed. Use a forward repair.';
  end if;
end;
$rollback_guard$;

drop policy "Gio uploads soundboard audio" on storage.objects;
drop policy "Gio lists soundboard audio" on storage.objects;
delete from storage.buckets where id = 'soundboard-audio';
drop trigger touch_soundboard_clip on public.soundboard_clips;
drop function luis_ruiz_private.touch_soundboard_clip();
drop function public.reserve_soundboard_upload();
drop table public.soundboard_upload_windows;
drop table public.soundboard_clips;
commit;
