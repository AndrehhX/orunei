drop policy if exists "authenticated users can read profile identity" on public.profiles;

create policy "eligible viewers can read profile identity"
  on public.profiles for select
  to authenticated
  using (
    auth.uid() = id
    or profile_visibility = 'public'
    or public.are_friends(auth.uid(), id)
  );
