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
