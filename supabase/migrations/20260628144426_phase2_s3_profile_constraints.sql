alter table public.user_profiles
  alter column role set not null;

alter table public.user_profiles
  add constraint user_profiles_user_id_key unique (user_id);
