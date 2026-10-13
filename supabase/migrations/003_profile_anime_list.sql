create table if not exists public.profile_anime (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  anime_id text not null,
  title text not null check (char_length(title) between 1 and 160),
  search_title text not null default '',
  status text not null default 'planned' check (status in ('watching', 'planned', 'paused', 'completed')),
  favorite boolean not null default false,
  poster_url text not null default '',
  banner_url text not null default '',
  genres text[] not null default '{}',
  year integer,
  updated_at timestamptz not null default now(),
  primary key (profile_id, anime_id)
);

create index if not exists profile_anime_profile_status_idx
  on public.profile_anime (profile_id, status);

alter table public.profile_anime enable row level security;

create policy "owners can read their anime list"
  on public.profile_anime for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "eligible viewers can read shared anime list"
  on public.profile_anime for select
  to authenticated
  using (
    (not favorite and exists (
      select 1 from public.profile_privacy
      where profile_id = profile_anime.profile_id
        and section = 'animeList'
        and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
    ))
    or (favorite and exists (
      select 1 from public.profile_privacy
      where profile_id = profile_anime.profile_id
        and section = 'favorites'
        and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
    ))
  );

create policy "owners can insert anime entries"
  on public.profile_anime for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "owners can update anime entries"
  on public.profile_anime for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "owners can delete anime entries"
  on public.profile_anime for delete
  to authenticated
  using (auth.uid() = profile_id);
