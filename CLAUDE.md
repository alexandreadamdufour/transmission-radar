# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Transmission Radar — a public intelligence platform tracking business transfers (cessions) of French SMEs. It is the companion tool to the Institut Sapiens policy note *"La vague de transmission des PME françaises (2025-2035)"*. Public GitHub repo, live demo on Vercel.

## Stack

- Next.js (App Router, TypeScript strict)
- Tailwind CSS
- Supabase (Postgres)
- Recharts
- Deployment: Vercel
- Package manager: pnpm
- Conventional commits

## Data sources (public APIs only — no scraping)

1. **BODACC via Opendatasoft** (`bodacc-datadila.opendatasoft.com`) — dataset `annonces-commerciales`, filtered to the "vente et cession" family. This is the primary source of transfer announcements.
2. **Enrichissement SIRENE** via `recherche-entreprises.api.gouv.fr`, queried by SIREN — adds NAF code, headcount (effectifs), and company creation date. Throttle to ~5 req/s to stay within fair use.

## Architecture

- Single Supabase table, `cessions`, holds all ingested and enriched records — no multi-table normalization.
- Ingestion is a standalone script that backfills 12 months of BODACC history, plus a daily Vercel cron route protected by a `CRON_SECRET` header/query check for ongoing updates.
- A scoring function computes a 0–100 opportunity score per cession based on: SME-range headcount, company age (>15 years), sector (industrie, BTP, commerce de gros), and region. Scoring is applied at ingestion/enrichment time, not computed on the fly in the UI.
- The frontend is a single-page dashboard: 4 KPI cards, 2 charts (monthly volume, regional breakdown), a filterable table with CSV export, plus a separate `/methodologie` page documenting the scoring logic.

## Constraints (keep in mind for every change)

- No over-engineering — this is a scoped 3-hour build, not a platform.
- No E2E tests.
- No auth.
- No interactive map.
- Data sourcing must stay to the two public APIs above — no scraping.

## Build phases

Work proceeds in phases; each phase ends with a validation checkpoint before moving to the next:

0. CLAUDE.md + Next.js init + Supabase schema (single `cessions` table)
1. Ingestion script + 12-month backfill + daily cron route (`CRON_SECRET`-protected)
2. Scoring (0–100)
3. Dashboard (KPIs, charts, filterable/exportable table, `/methodologie` page)
4. English README with screenshots (hook → problem → solution → architecture → scoring → stack)

## Commands

Not yet established — no `package.json` exists yet. Once the Next.js project is initialized (Phase 0), record here: `pnpm dev`, `pnpm build`, `pnpm lint`, and how to run the ingestion/backfill script.
