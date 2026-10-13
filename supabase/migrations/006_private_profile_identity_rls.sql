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
