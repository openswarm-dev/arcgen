-- Creator profiles keyed by connected wallet. Handles are stored as JSON:
-- { twitch, kick, youtube, x, reddit, instagram, tiktok, pumpfun, fomo }

create table if not exists public.creator_profiles (
  wallet_address text primary key,
  display_name text,
  bio text,
  avatar_url text,
  handles jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_profiles enable row level security;

drop policy if exists "Creator profiles are viewable by everyone" on public.creator_profiles;
create policy "Creator profiles are viewable by everyone"
  on public.creator_profiles
  for select
  using (true);

drop trigger if exists creator_profiles_set_updated_at on public.creator_profiles;

create trigger creator_profiles_set_updated_at
  before update on public.creator_profiles
  for each row
  execute function public.set_updated_at();
