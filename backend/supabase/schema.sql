-- ============================================================================
--  Lingo Speek — Supabase SQL Schema
--  Bu kodni Supabase Dashboard -> SQL Editor -> New query oynasiga qo'yib,
--  "Run" tugmasini bosing.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
--  1. profiles — Foydalanuvchilar jadvali
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  name                  text,
  username              text unique,
  email                 text unique,
  phone                 text unique,
  password_hash         text,
  provider              text not null default 'password'
                        check (provider in ('password', 'phone', 'google')),
  google_email          text,
  country_code          text,
  region                text,
  age                   integer,
  purpose               text,
  gender                text,
  diamonds              integer not null default 0,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Agar jadval avval yaratilgan bo'lsa, username ustunini qo'shish:
alter table public.profiles add column if not exists username text unique;

-- Email yoki telefon raqamidan kamida bittasi bo'lishi shart
alter table public.profiles
  drop constraint if exists profiles_identifier_check;
alter table public.profiles
  add constraint profiles_identifier_check
  check (email is not null or phone is not null);

create index if not exists profiles_email_idx     on public.profiles (lower(email));
create index if not exists profiles_username_idx  on public.profiles (lower(username));
create index if not exists profiles_phone_idx     on public.profiles (phone);
create index if not exists profiles_country_idx   on public.profiles (country_code);

-- ─────────────────────────────────────────────────────────────────────────────
--  2. google_accounts — Google orqali kirgan emaillar ro'yxati
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.google_accounts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  user_id     uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists google_accounts_user_idx on public.google_accounts (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  3. onboarding_answers — 4 bosqichli savollar (so'rovnoma) javoblari
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.onboarding_answers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  age           integer check (age between 5 and 120),
  country_code  text,
  purpose       text check (purpose in ('friends', 'dating', 'language')),
  gender        text check (gender in ('male', 'female', 'gay', 'unspecified')),
  created_at    timestamptz not null default now()
);

create index if not exists onboarding_user_idx on public.onboarding_answers (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
--  4. updated_at vaqtini avtomatik yangilash triggeri
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
--  5. Row Level Security (RLS) va Ruxsatlar (anon & service_role)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.google_accounts     enable row level security;
alter table public.onboarding_answers  enable row level security;

-- Anon va Authenticated foydalanuvchilar uchun ruxsat siyosatlari
-- (Node.js API anon key yoki service_role bilan so'rov yuborganda muammosiz ishlashi uchun)
drop policy if exists "Enable all operations for profiles" on public.profiles;
create policy "Enable all operations for profiles"
  on public.profiles for all
  using (true)
  with check (true);

drop policy if exists "Enable all operations for google_accounts" on public.google_accounts;
create policy "Enable all operations for google_accounts"
  on public.google_accounts for all
  using (true)
  with check (true);

drop policy if exists "Enable all operations for onboarding_answers" on public.onboarding_answers;
create policy "Enable all operations for onboarding_answers"
  on public.onboarding_answers for all
  using (true)
  with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
--  6. Tekshirish
-- ─────────────────────────────────────────────────────────────────────────────
select table_name, (select count(*) from information_schema.columns c
                    where c.table_schema = 'public' and c.table_name = t.table_name) as columns
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('profiles', 'google_accounts', 'onboarding_answers')
order by table_name;
