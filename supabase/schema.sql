create table if not exists public.al_toque_state (
  key text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.al_toque_state enable row level security;
revoke all on table public.al_toque_state from anon, authenticated;
grant all on table public.al_toque_state to service_role;

create table if not exists public.al_toque_complaints (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  kind text not null check (kind in ('reclamo', 'queja')),
  consumer_name varchar(120) not null,
  document_type text not null check (document_type in ('DNI', 'CE')),
  document_number varchar(12) not null,
  address varchar(200) not null,
  email varchar(254) not null,
  phone varchar(24) not null,
  product varchar(160) not null,
  amount numeric(10, 2) check (amount is null or amount between 0 and 1000000),
  description varchar(2000) not null,
  request varchar(1000) not null,
  privacy_consent boolean not null check (privacy_consent),
  privacy_consented_at timestamptz not null default now()
);

alter table public.al_toque_complaints enable row level security;
revoke all on table public.al_toque_complaints from anon, authenticated;
grant all on table public.al_toque_complaints to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'al-toque-reels',
  'al-toque-reels',
  true,
  52428800,
  array['video/mp4', 'video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
