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
