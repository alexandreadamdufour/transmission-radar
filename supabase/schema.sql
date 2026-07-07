-- Transmission Radar — single-table schema
-- Run once against the Supabase project (SQL editor or migration tooling).

create table if not exists cessions (
  id uuid primary key default gen_random_uuid(),
  bodacc_id text not null unique,

  -- BODACC announcement
  date_parution date not null,
  siren text,
  denomination text,
  activite text,
  categorie_vente text,
  tribunal text,
  ville text,
  code_postal text,
  departement text,
  departement_nom text,
  region_code text,
  region_nom text,
  url_bodacc text,

  -- SIRENE enrichment (recherche-entreprises.api.gouv.fr)
  naf_code text,
  naf_label text,
  effectifs text,
  date_creation_entreprise date,
  enriched boolean not null default false,
  enrichment_error text,

  -- Scoring
  score integer,
  score_details jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cessions_date_parution_idx on cessions (date_parution desc);
create index if not exists cessions_region_idx on cessions (region_nom);
create index if not exists cessions_score_idx on cessions (score desc);

alter table cessions enable row level security;

create policy if not exists "public read access"
  on cessions for select
  to anon
  using (true);
