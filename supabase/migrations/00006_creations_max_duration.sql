alter table public.creations drop constraint if exists creations_duration_check;

alter table public.creations
  add constraint creations_duration_check check (duration between 2 and 20);
