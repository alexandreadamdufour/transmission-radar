-- Transmission Radar — alertes email (feature 1)
-- À exécuter une fois dans le SQL Editor Supabase (ou via psql avec la
-- connection string du projet). Rétrocompatible : ne touche pas à `cessions`.

create table if not exists alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  criteria jsonb not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alert_subscriptions_active_idx
  on alert_subscriptions (confirmed_at)
  where confirmed_at is not null and unsubscribed_at is null;

create table if not exists alert_sends (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references alert_subscriptions (id) on delete cascade,
  sent_at timestamptz not null default now(),
  cession_ids uuid[] not null default '{}',
  status text not null
);

create index if not exists alert_sends_subscription_idx on alert_sends (subscription_id);

alter table alert_subscriptions enable row level security;
alter table alert_sends enable row level security;

-- Aucune policy = aucun accès via anon/authenticated (PostgREST par défaut).
-- Toutes les opérations passent par le service_role key côté serveur
-- (routes /api/alertes/*, cron hebdo), jamais depuis le client.
