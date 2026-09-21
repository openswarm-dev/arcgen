alter table public.creations
  add column if not exists reference_image_url text;
