-- Dynamic QR code tracking and privacy-preserving scan analytics.
-- All operations are performed server-side by the service role.
-- RLS is enabled on all tables; anon and authenticated roles have no access.

create extension if not exists "pgcrypto";

-- Dynamic QR records table
create table if not exists public.qr_codes (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^[a-zA-Z0-9_-]{1,64}$'),
  name            text not null,
  destination_url text not null check (destination_url ~* '^https?://'),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Individual scan events table (strictly anonymized: no raw IP address is stored)
create table if not exists public.qr_scans (
  id                uuid primary key default gen_random_uuid(),
  qr_id             uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at        timestamptz not null default now(),

  -- Geolocation (derived server-side via Vercel edge/function headers)
  country           text,
  region            text,
  city              text,
  latitude          double precision,
  longitude         double precision,
  postal_code       text,

  -- Client device & environment (parsed server-side from User-Agent)
  device_type       text not null default 'unknown'
                      check (device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  operating_system  text not null default 'unknown',
  browser           text not null default 'unknown',
  referrer          text,

  -- Privacy-preserving identifiers: deterministic salted SHA-256 hashes
  user_agent_hash   text not null,
  visitor_hash      text not null,

  -- Bot detection flag
  is_bot            boolean not null default false
);

-- Fast lookup indexes
create index if not exists qr_codes_code_idx on public.qr_codes (code);
create index if not exists qr_scans_qr_id_idx on public.qr_scans (qr_id);
create index if not exists qr_scans_scanned_at_idx on public.qr_scans (scanned_at desc);
create index if not exists qr_scans_country_city_idx on public.qr_scans (country, city);
create index if not exists qr_scans_visitor_hash_idx on public.qr_scans (visitor_hash);
create index if not exists qr_scans_qr_visitor_idx on public.qr_scans (qr_id, visitor_hash);
create index if not exists qr_scans_qr_scanned_idx on public.qr_scans (qr_id, scanned_at desc);

-- Function and trigger to automatically bump updated_at on qr_codes
create or replace function public.set_qr_codes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_qr_codes_updated_at_trigger on public.qr_codes;
create trigger set_qr_codes_updated_at_trigger
  before update on public.qr_codes
  for each row
  execute function public.set_qr_codes_updated_at();

-- Enforce strict Row Level Security
alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;

-- Revoke direct permissions from public anon and authenticated roles
revoke all on public.qr_codes from anon, authenticated;
revoke all on public.qr_scans from anon, authenticated;

-- Seed default primary QR code for AURA
insert into public.qr_codes (code, name, destination_url, active)
values (
  'aura',
  'AURA Main Portal',
  'https://join-aura.vercel.app/',
  true
)
on conflict (code) do nothing;
