-- Enable RLS for storage.objects if not already enabled
alter table storage.objects enable row level security;

-- 1. Create the 'images' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access to 'images' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- 3. Allow Authenticated Users to Upload to 'images' bucket
create policy "Authenticated Users can Insert"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);

-- 4. Allow Authenticated Users to Delete their own images
create policy "Users can Delete Own Images"
on storage.objects for delete
using (
  bucket_id = 'images'
  and auth.uid() = owner
);
