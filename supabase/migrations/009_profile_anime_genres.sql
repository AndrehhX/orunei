alter table public.profile_anime
  add column if not exists genres text[] not null default '{}';
