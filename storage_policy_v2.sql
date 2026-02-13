-- 1. Create the 'images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Users can Insert" on storage.objects;
drop policy if exists "Users can Delete Own Images" on storage.objects;

-- 3. Allow Public Read Access to 'images' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- 4. Allow Authenticated Users to Upload to 'images' bucket
create policy "Authenticated Users can Insert"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);

-- 5. Allow Authenticated Users to Delete their own images
create policy "Users can Delete Own Images"
on storage.objects for delete
using (
  bucket_id = 'images'
  and auth.uid() = owner
);
