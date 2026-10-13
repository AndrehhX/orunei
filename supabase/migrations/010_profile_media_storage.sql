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
