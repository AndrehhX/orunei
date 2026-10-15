-- ========================================================
-- ORUNEI: SCRIPT MAESTRO DE CONFIGURACION SUPABASE (AISLADO)
-- Generado para inicializar la base de datos sin datos de prod
-- ========================================================

-- --------------------------------------------------------
-- Migracion: 001_profile_foundation.sql
-- --------------------------------------------------------
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
  section text not null check (section in ('animeList', 'favorites', 'activity', 'lists')),
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


-- --------------------------------------------------------
-- Migracion: 002_social_relationships.sql
-- --------------------------------------------------------
alter table public.profiles
  add column if not exists profile_visibility text not null default 'public';

do $$
begin
  alter table public.profiles
    add constraint profiles_profile_visibility_check
    check (profile_visibility in ('private', 'public'));
exception
  when duplicate_object then null;
end $$;

create unique index if not exists friendships_unordered_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_addressee_status_idx
  on public.friendships (addressee_id, status);

create or replace function public.keep_friendship_participants()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'friendship participants are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists friendships_participants_immutable on public.friendships;
create trigger friendships_participants_immutable
  before update on public.friendships
  for each row execute function public.keep_friendship_participants();

alter table public.friendships enable row level security;

create policy "participants can read friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "users can send pending requests"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = requester_id and requester_id <> addressee_id and status = 'pending');

create policy "addressees can respond to requests"
  on public.friendships for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status in ('accepted', 'declined', 'blocked'));

create policy "requesters can cancel pending requests"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = requester_id and status = 'pending');

create policy "participants can remove accepted friendships"
  on public.friendships for delete
  to authenticated
  using ((auth.uid() = requester_id or auth.uid() = addressee_id) and status = 'accepted');

create table if not exists public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists profile_comments_profile_created_idx
  on public.profile_comments (profile_id, created_at desc);

alter table public.profile_comments enable row level security;

create or replace function public.can_interact_with_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = target_profile
        and (id = auth.uid() or profile_visibility = 'public')
    )
    and not exists (
      select 1 from public.friendships
      where status = 'blocked'
        and ((requester_id = auth.uid() and addressee_id = target_profile)
          or (requester_id = target_profile and addressee_id = auth.uid()))
    );
$$;

create policy "eligible viewers can read comments"
  on public.profile_comments for select
  to authenticated
  using (deleted_at is null and public.can_interact_with_profile(profile_id));

create policy "eligible viewers can create comments"
  on public.profile_comments for insert
  to authenticated
  with check (author_id = auth.uid() and public.can_interact_with_profile(profile_id));

create policy "authors can edit comments"
  on public.profile_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "authors and owners can delete comments"
  on public.profile_comments for delete
  to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());


-- --------------------------------------------------------
-- Migracion: 003_profile_anime_list.sql
-- --------------------------------------------------------
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


-- --------------------------------------------------------
-- Migracion: 004_profile_lists.sql
-- --------------------------------------------------------
create table if not exists public.profile_lists (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  list_id text not null,
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 160),
  accent text not null default '#6d5cff' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  anime_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, list_id)
);

create index if not exists profile_lists_profile_updated_idx
  on public.profile_lists (profile_id, updated_at desc);

alter table public.profile_lists enable row level security;

create policy "owners can read their lists"
  on public.profile_lists for select
  to authenticated
  using (auth.uid() = profile_id);

create policy "eligible viewers can read shared lists"
  on public.profile_lists for select
  to authenticated
  using (
    exists (
      select 1 from public.profile_privacy
      where profile_id = profile_lists.profile_id
        and section = 'lists'
        and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
    )
  );

create policy "owners can insert lists"
  on public.profile_lists for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "owners can update lists"
  on public.profile_lists for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "owners can delete lists"
  on public.profile_lists for delete
  to authenticated
  using (auth.uid() = profile_id);


-- --------------------------------------------------------
-- Migracion: 005_profile_identity_rls.sql
-- --------------------------------------------------------
drop policy if exists "authenticated users can read profile identity" on public.profiles;

create policy "eligible viewers can read profile identity"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or profile_visibility = 'public'
    or public.are_friends(auth.uid(), id)
  );


-- --------------------------------------------------------
-- Migracion: 006_private_profile_identity_rls.sql
-- --------------------------------------------------------
-- A private profile must not expose its identity to other accounts, including
-- accepted friends. Section-level `friends` visibility still applies when the
-- profile itself is public.
drop policy if exists "eligible viewers can read profile identity" on public.profiles;

create policy "eligible viewers can read profile identity"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or profile_visibility = 'public'
  );


-- --------------------------------------------------------
-- Migracion: 007_private_profile_sections_rls.sql
-- --------------------------------------------------------
-- Section-level sharing only applies when the profile itself is public.
-- Owners retain access to their own private profile data.

drop policy if exists "owners and eligible viewers can read privacy" on public.profile_privacy;
create policy "owners and eligible viewers can read privacy"
  on public.profile_privacy for select
  to authenticated
  using (
    auth.uid() = profile_id
    or exists (
      select 1
      from public.profiles
      where id = profile_privacy.profile_id
        and profile_visibility = 'public'
    )
      and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
  );

drop policy if exists "owners and eligible viewers can read activity" on public.profile_activity;
create policy "owners and eligible viewers can read activity"
  on public.profile_activity for select
  to authenticated
  using (
    auth.uid() = profile_id
    or exists (
      select 1
      from public.profiles
      where id = profile_activity.profile_id
        and profile_visibility = 'public'
    )
      and exists (
        select 1
        from public.profile_privacy
        where profile_id = profile_activity.profile_id
          and section = 'activity'
          and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
      )
  );

drop policy if exists "eligible viewers can read shared anime list" on public.profile_anime;
create policy "eligible viewers can read shared anime list"
  on public.profile_anime for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = profile_anime.profile_id
        and profile_visibility = 'public'
    )
      and ((not favorite and exists (
        select 1 from public.profile_privacy
        where profile_id = profile_anime.profile_id
          and section = 'animeList'
          and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
      )) or (favorite and exists (
        select 1 from public.profile_privacy
        where profile_id = profile_anime.profile_id
          and section = 'favorites'
          and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
      )))
  );

drop policy if exists "eligible viewers can read shared lists" on public.profile_lists;
create policy "eligible viewers can read shared lists"
  on public.profile_lists for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = profile_lists.profile_id
        and profile_visibility = 'public'
    )
      and exists (
        select 1 from public.profile_privacy
        where profile_id = profile_lists.profile_id
          and section = 'lists'
          and (visibility = 'public' or (visibility = 'friends' and public.are_friends(auth.uid(), profile_id)))
      )
  );


-- --------------------------------------------------------
-- Migracion: 008_remove_unsupported_profile_sections.sql
-- --------------------------------------------------------
-- The first release exposes only sections backed by real profile data.
delete from public.profile_privacy
where section in ('taste', 'reviews');

alter table public.profile_privacy
  drop constraint if exists profile_privacy_section_check;

alter table public.profile_privacy
  add constraint profile_privacy_section_check
  check (section in ('animeList', 'favorites', 'activity', 'lists'));


-- --------------------------------------------------------
-- Migracion: 009_profile_anime_genres.sql
-- --------------------------------------------------------
alter table public.profile_anime
  add column if not exists genres text[] not null default '{}';


-- --------------------------------------------------------
-- Migracion: 010_profile_media_storage.sql
-- --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owners can upload profile media'
  ) then
    create policy "owners can upload profile media"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owners can update profile media'
  ) then
    create policy "owners can update profile media"
      on storage.objects for update
      to authenticated
      using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
      with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'owners can delete profile media'
  ) then
    create policy "owners can delete profile media"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
  end if;
end $$;


-- --------------------------------------------------------
-- Migracion: 011_profile_media_select_rls.sql
-- --------------------------------------------------------
drop policy if exists "owners can read profile media" on storage.objects;

create policy "owners can read profile media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);


