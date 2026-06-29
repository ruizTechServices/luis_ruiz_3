alter table public.user_profiles
  drop constraint if exists user_profiles_user_id_key;

alter table public.user_profiles
  alter column role drop not null;
