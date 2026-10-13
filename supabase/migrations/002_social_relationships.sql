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
  using (author_id = auth.uid() or profile_id = auth.uid())
  with check (author_id = auth.uid() or profile_id = auth.uid());

create policy "authors and owners can delete comments"
  on public.profile_comments for delete
  to authenticated
  using (author_id = auth.uid() or profile_id = auth.uid());
