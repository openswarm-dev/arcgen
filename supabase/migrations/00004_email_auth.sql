-- Email/password identity. Creator profiles belong to auth users.
-- Wallet is optional and no longer the primary key.

alter table public.profiles
  add column if not exists email text,
  add column if not exists email_verified_at timestamptz;

create unique index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email is not null;

alter table public.creator_profiles
  add column if not exists user_id uuid;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_pkey;

alter table public.creator_profiles
  alter column wallet_address drop not null;

delete from public.creator_profiles
where user_id is null;

alter table public.creator_profiles
  alter column user_id set not null;

alter table public.creator_profiles
  drop constraint if exists creator_profiles_user_id_fkey;

alter table public.creator_profiles
  add constraint creator_profiles_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.creator_profiles
  add constraint creator_profiles_pkey primary key (user_id);

drop index if exists creator_profiles_wallet_address_key;

create unique index if not exists creator_profiles_wallet_address_key
  on public.creator_profiles (wallet_address)
  where wallet_address is not null;

drop policy if exists "Users can insert their own creator profile" on public.creator_profiles;
create policy "Users can insert their own creator profile"
  on public.creator_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own creator profile" on public.creator_profiles;
create policy "Users can update their own creator profile"
  on public.creator_profiles
  for update
  using (auth.uid() = user_id);

create table if not exists public.email_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  pin_hash text not null,
  purpose text not null default 'signup' check (purpose in ('signup', 'signin')),
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_lookup_idx
  on public.email_otps (lower(email), purpose, created_at desc);

alter table public.email_otps enable row level security;

revoke all on table public.email_otps from anon, authenticated;
grant all on table public.email_otps to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_name text;
begin
  next_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    split_part(new.email, '@', 1),
    new.email
  );

  insert into public.profiles (id, display_name, email)
  values (new.id, next_name, new.email)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name);

  insert into public.creator_profiles (user_id, display_name)
  values (new.id, next_name)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
