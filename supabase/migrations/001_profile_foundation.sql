create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9_.-]{2,23}$'),
  display_name text not null default 'Usuario de Orunei' check (char_length(display_name) between 1 and 50),
  bio text not null default '' check (char_length(bio) <= 280),
  status text not null default '' check (char_length(status) <= 100),
  avatar_url text not null default '',
  banner_url text not null default '',
  accent text not null default '#6d5cff' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  featured_anime_id text not null default '',
  pinned_sections jsonb not null default '["overview", "animelist", "favorites"]'::jsonb,
  landing_section text not null default 'overview',
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_privacy (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('animeList', 'favorites', 'taste', 'activity', 'reviews', 'lists')),
  visibility text not null default 'private' check (visibility in ('private', 'friends', 'public')),
  primary key (profile_id, section)
);

create table if not exists public.profile_activity (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'profile',
  label text not null check (char_length(label) between 1 and 180),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create or replace function public.are_friends(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select first_user is not null
    and second_user is not null
    and exists (
      select 1
      from public.friendships
      where status = 'accepted'
        and ((requester_id = first_user and addressee_id = second_user)
          or (requester_id = second_user and addressee_id = first_user))
    );
$$;

alter table public.profiles enable row level security;
alter table public.profile_privacy enable row level security;
alter table public.profile_activity enable row level security;

create policy "authenticated users can read profile identity"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "owners can insert their profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "owners can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "owners and eligible viewers can read privacy"
  on public.profile_privacy for select
  using (
    auth.uid() = profile_id
    or visibility = 'public'
    or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id))
  );

create policy "owners can manage privacy"
  on public.profile_privacy for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "owners and eligible viewers can read activity"
  on public.profile_activity for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1
      from public.profile_privacy
      where profile_id = profile_activity.profile_id
        and section = 'activity'
        and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
    )
  );

create policy "owners can manage activity"
  on public.profile_activity for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do nothing;

create policy "owners can upload profile media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners can update profile media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owners can delete profile media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
