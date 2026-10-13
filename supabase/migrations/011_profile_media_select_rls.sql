drop policy if exists "owners can read profile media" on storage.objects;

create policy "owners can read profile media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
