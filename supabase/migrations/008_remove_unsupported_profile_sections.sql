-- The first release exposes only sections backed by real profile data.
delete from public.profile_privacy
where section in ('taste', 'reviews');

alter table public.profile_privacy
  drop constraint if exists profile_privacy_section_check;

alter table public.profile_privacy
  add constraint profile_privacy_section_check
  check (section in ('animeList', 'favorites', 'activity', 'lists'));
