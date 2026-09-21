create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  prompt text not null,
  title text,
  model text not null default 'alibaba/wan-3.0',
  duration integer not null default 5 check (duration between 2 and 20),
  resolution text not null default '720p',
  aspect_ratio text not null default '9:16',
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  provider_job_id text,
  video_url text,
  thumbnail_url text,
  error_message text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists creations_explore_idx
  on public.creations (created_at desc)
  where is_public = true and status = 'completed';

create index if not exists creations_wallet_idx
  on public.creations (wallet_address, created_at desc);

alter table public.creations enable row level security;

create policy "Public can read completed creations"
  on public.creations
  for select
  using (is_public = true and status = 'completed');
