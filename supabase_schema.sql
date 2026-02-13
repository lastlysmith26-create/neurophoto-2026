-- Create tables for NeuroPhoto

-- 1. Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users not null,
  email text,
  full_name text,
  avatar_url text,
  primary key (id)
);

-- 2. Models
create table models (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  gender text not null,
  description text,
  photos jsonb, -- Storing array of photos as JSONB for simplicity
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Generations (History)
create table generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  model_id uuid references models(id),
  image_url text not null,
  filename text not null,
  product_type text,
  background text,
  pose text,
  parameters jsonb,
  is_variation boolean default false,
  variation_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Storage Buckets
-- You need to create a bucket named 'images' in the Storage section of Supabase dashboard
-- Policy to allow public read access
-- Policy to allow authenticated uploads

-- 5. RLS Policies (Row Level Security)

-- Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Models
alter table models enable row level security;
create policy "Users can view own models." on models for select using ( auth.uid() = user_id );
create policy "Users can insert own models." on models for insert with check ( auth.uid() = user_id );
create policy "Users can update own models." on models for update using ( auth.uid() = user_id );
create policy "Users can delete own models." on models for delete using ( auth.uid() = user_id );

-- Generations
alter table generations enable row level security;
create policy "Users can view own generations." on generations for select using ( auth.uid() = user_id );
create policy "Users can insert own generations." on generations for insert with check ( auth.uid() = user_id );
create policy "Users can delete own generations." on generations for delete using ( auth.uid() = user_id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
