alter table public.creations
  add column if not exists reference_video_url text,
  add column if not exists reference_media jsonb,
  add column if not exists input_mode text default 'simple',
  add column if not exists provider text default 'openrouter';
