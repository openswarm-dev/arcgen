-- Banner image for creator profiles.

alter table public.creator_profiles
  add column if not exists banner_url text;
