# État du projet — Transmission Radar

_Généré automatiquement à la fin du build. Dernière mise à jour : voir le dernier commit._

## URLs

- **Live demo** : https://transmission-radar.vercel.app
- **Repo GitHub** : https://github.com/alexandreadamdufour/transmission-radar
- **Dashboard Vercel** : https://vercel.com/alex-orga/transmission-radar

## Ce qui est fait

- **Phase 0** — Next.js (App Router, TS strict) + Tailwind scaffoldé, table Supabase `cessions` créée (RLS + policy de lecture publique), build/typecheck/lint OK.
- **Phase 1** — Pipeline d'ingestion (`src/lib/ingest.ts`) : pagination BODACC avec découpage automatique des fenêtres de dates (limite Opendatasoft à 10 000 offset+limit), enrichissement SIRENE throttlé à ~5 req/s, upsert Supabase dédupliqué sur `bodacc_id`. Script de backfill (`pnpm ingest -- --days=N`) et route cron quotidienne (`/api/cron/ingest`, protégée par `CRON_SECRET`, testée : 401 sans secret confirmé en local et en prod). Cron enregistré côté Vercel (`0 4 * * *`).
- **Phase 2** — Scoring 0-100 (`src/lib/scoring.ts`), calculé une fois à l'enrichissement, jamais côté client.
- **Phase 3** — Dashboard une page : 4 KPI cards, 2 graphiques Recharts (volume mensuel, répartition régionale), table filtrable (région/secteur/score/recherche texte) avec export CSV, page `/methodologie`. Build de production + lint validés.
- **Phase 4** — README anglais (hook → problème → solution → architecture → scoring → stack).
- **Finalisation** — Repo GitHub public créé et poussé (5 commits conventionnels, un par phase). Projet Vercel lié, 4 variables d'environnement configurées (Production/Preview/Development), déployé en production et vérifié (200 sur `/` et `/methodologie`, 401 sur le cron sans secret).

## Ce qui a été dégradé

- **Backfill réduit de 12 mois à 90 jours.** Le volume réel sur 12 mois est d'environ 47 700 annonces "Ventes et cessions" ; à 5 req/s (fair-use SIRENE), l'enrichissement complet aurait pris ~2h40, incompatible avec le budget de 3h. Sur 90 jours (~12 100 annonces), l'enrichissement prend ~35-40 min. Documenté dans `/methodologie` et dans le README. Le cron quotidien continuera d'alimenter la base au-delà de cette fenêtre.
- **Backfill toujours en cours au moment de la clôture de cette session.** Sur commande explicite, je n'ai pas attendu sa fin pour finaliser. État au moment du commit : **~5 010 lignes déjà upsertées en base** sur ~12 100 attendues (~4 600/12 110 annonces BODACC déjà traitées, soit ~38%), le process tourne toujours en arrière-plan localement (PID 60315, log `/tmp/backfill.log`) et devrait terminer d'ici ~1h30-2h au rythme actuel de throttling SIRENE (~5 req/s). Le dashboard en production est donc déjà fonctionnel et alimenté, mais avec un jeu de données partiel qui continuera de grossir. Si ce process local est interrompu avant la fin, relancer simplement `pnpm ingest -- --days=90` : l'upsert est idempotent (dédup sur `bodacc_id`), aucun risque de doublon. Le cron quotidien Vercel prendra ensuite le relais pour les nouvelles annonces.
- **Screenshots absents du README.** L'utilisateur a explicitement demandé l'arrêt de toute action navigateur pour le reste du projet (initialement pour Supabase, étendu à "plus aucune action navigateur"). Je n'ai donc pas pu générer de captures d'écran du dashboard sans utiliser un navigateur (Chrome ou headless). Le README contient un placeholder avec une note explicative. À faire manuellement, ou en me redonnant l'autorisation d'une action navigateur ponctuelle.
- **Test end-to-end du cron avec secret valide interrompu.** Le test du chemin non-autorisé (401) a été validé en local et en prod. Le test avec secret valide a été lancé en local mais interrompu volontairement (arrêt du serveur dev pour libérer le port avant le build de prod) pour éviter de dupliquer la charge sur les APIs pendant le backfill en cours. La logique d'ingestion elle-même (`runIngestion`) a été validée à plusieurs reprises via le script CLI — le risque résiduel est donc faible mais le chemin cron-authentifié n'a pas été exercé de bout en bout en conditions réelles.

## Vérifications effectuées

- `pnpm build`, `pnpm lint`, `tsc --noEmit` : OK.
- Ingestion testée en CLI (1 jour puis 90 jours) : lignes réellement insérées en base, vérifiées via l'API REST Supabase (`content-range`).
- Dashboard testé via `curl` en dev (port 3001, le 3000 étant occupé par un autre projet local) et en production : rendu HTML avec contenu réel (KPI, tableau), pas d'erreur de rendu SSR.
- `.env.local` confirmé non tracké par git avant le premier push (`.gitignore` contient `.env*`), seul `.env.local.example` (vide) est versionné.

## Notes techniques

- Le schéma SQL a été appliqué directement via le SQL Editor du dashboard Supabase (pas de mot de passe Postgres ni de token Management API disponible pour une exécution en CLI). Toutes les opérations suivantes (ingestion, lecture) passent exclusivement par l'API REST/PostgREST avec les clés `sb_publishable_...` / `sb_secret_...`, conformément à la consigne de ne plus utiliser le navigateur.
- Le port 3000 est occupé localement par un autre projet ("Twenty" CRM) ; `pnpm dev` bascule automatiquement sur 3001.
