-- ArcGen wallet-first profiles and public storage for generated media.

create table if not exists public.wallet_profiles (
  wallet_address text primary key,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_profiles enable row level security;

drop policy if exists "Wallet profiles are viewable by everyone" on public.wallet_profiles;
create policy "Wallet profiles are viewable by everyone"
  on public.wallet_profiles
  for select
  using (true);

drop trigger if exists wallet_profiles_set_updated_at on public.wallet_profiles;
create trigger wallet_profiles_set_updated_at
  before update on public.wallet_profiles
  for each row
  execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'creations',
  'creations',
  true,
  104857600,
  array['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read creation files" on storage.objects;
create policy "Public read creation files"
  on storage.objects
  for select
  using (bucket_id = 'creations');
