create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'Staff',
  primary_role text,
  assigned_track text,
  wallpaper_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_director()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'Director'
  );
$$;

create table if not exists public.staff_registration_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  code_hint text not null,
  roles text[] not null default '{}'::text[],
  used boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  used_by uuid references auth.users (id),
  used_at timestamptz
);

create table if not exists public.staff_gate_passkeys (
  id uuid primary key default gen_random_uuid(),
  pin_hash text not null unique,
  pin_hint text not null,
  user_id uuid references auth.users (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.staff_registration_codes enable row level security;
alter table public.staff_gate_passkeys enable row level security;

drop policy if exists "profiles read self or director" on public.profiles;
create policy "profiles read self or director"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_director()
);

drop policy if exists "profiles update wallpaper self" on public.profiles;
create policy "profiles update wallpaper self"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
);

drop policy if exists "profiles update specialist track by director" on public.profiles;
create policy "profiles update specialist track by director"
on public.profiles
for update
using (public.is_director())
with check (public.is_director());

drop policy if exists "registration codes read for validation" on public.staff_registration_codes;
create policy "registration codes read for validation"
on public.staff_registration_codes
for select
using (true);

drop policy if exists "registration codes insert director" on public.staff_registration_codes;
create policy "registration codes insert director"
on public.staff_registration_codes
for insert
with check (public.is_director());

drop policy if exists "registration codes update director" on public.staff_registration_codes;
create policy "registration codes update director"
on public.staff_registration_codes
for update
using (public.is_director())
with check (public.is_director());

drop policy if exists "registration codes delete director" on public.staff_registration_codes;
create policy "registration codes delete director"
on public.staff_registration_codes
for delete
using (public.is_director());

drop policy if exists "registration codes claim once" on public.staff_registration_codes;
create policy "registration codes claim once"
on public.staff_registration_codes
for update
using (
  auth.uid() is not null
  and used = false
)
with check (
  auth.uid() is not null
  and used = true
  and used_by = auth.uid()
  and used_at is not null
);

drop policy if exists "gate passkeys read for validation" on public.staff_gate_passkeys;
create policy "gate passkeys read for validation"
on public.staff_gate_passkeys
for select
using (true);

drop policy if exists "gate passkeys insert self" on public.staff_gate_passkeys;
create policy "gate passkeys insert self"
on public.staff_gate_passkeys
for insert
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);

drop policy if exists "gate passkeys revoke self" on public.staff_gate_passkeys;
create policy "gate passkeys revoke self"
on public.staff_gate_passkeys
for update
using (
  auth.uid() is not null
  and user_id = auth.uid()
)
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);

drop policy if exists "gate passkeys delete director" on public.staff_gate_passkeys;
create policy "gate passkeys delete director"
on public.staff_gate_passkeys
for delete
using (public.is_director());
