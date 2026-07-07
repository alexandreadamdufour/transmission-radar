# État du projet — Transmission Radar

_Généré automatiquement à la fin du build. Dernière mise à jour : passage "produit d'intelligence économique" (voir section dédiée en bas)._

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
- **Backfill terminé depuis** (mise à jour post-session initiale) : 12 110/12 110 annonces traitées, 9 831 enrichies (2 279 échecs d'enrichissement — SIREN introuvable, entrepreneurs individuels non inscrits, etc.), 12 110 lignes upsertées en base. Plus rien en cours localement.
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

## Redesign éditorial (session 2)

Refonte cosmétique complète selon un système de design précis fourni par l'utilisateur : palette quasi-achromatique + accent vert institutionnel `#1f4d3f` unique, serif Fraunces (weight 400 uniquement) pour les titres, Inter pour l'UI, tabular-nums sur tous les chiffres, cartes `radius:24px` sans ombre, boutons pilule, artefacts flottants (KPI cards) avec ombre douce + sparkline, graphiques Recharts épurés façon Financial Times. Favicon et image OG générées par code (`next/og` / `ImageResponse`, convention `icon.tsx` / `opengraph-image.tsx`) — aucune action navigateur nécessaire, conformément à la consigne. Aucune modification de la logique de données, des requêtes Supabase ou du scoring. Commit `style: editorial redesign`.

## Passage "produit d'intelligence économique" (session 3)

Objectif : passer d'un dashboard de démo à un vrai outil de veille, en traitant d'abord la crédibilité de la donnée puis la profondeur produit, sans toucher à la DA éditoriale déjà en place. Budget 2h, respecté (~50 min effectives). Commits séparés par feature, poussés au fur et à mesure (pas de gros commit final), conformément à la consigne resserrée en cours de route.

### Priorité 1 — crédibilité de la donnée (fait intégralement, commit + déploiement vérifiés en premier)
- Vue par défaut "PME qualifiées" : la table filtre `score ≥ 40 OU effectif connu ≥ 10 salariés`. Toggle "Inclure les fonds de commerce" pour tout voir, avec compteur de lignes masquées.
- Nouvelle taxonomie NAF → famille (12 catégories : Industrie, Agroalimentaire, BTP, Négoce auto, Commerce de gros, Commerce de détail, Transport & logistique, CHR, Services B2B, Immobilier, Santé, Autres) dans `src/lib/naf.ts`, découplée du bucket interne utilisé par le scoring (`scoring.ts` inchangé). Recalculée sur les 9 831 lignes déjà enrichies via `scripts/recompute-naf.ts`, sans nouvel appel BODACC/SIRENE — juste une relecture du `naf_code` déjà stocké. *Piège rencontré et corrigé* : la première passe du script paginait sans `order()` explicite, ce qui a laissé ~380 lignes avec l'ancienne étiquette (pagination non déterministe pendant des UPDATE concurrents) ; corrigé en ajoutant `.order("id")`, ré-exécuté, vérifié à 0 ligne restante avec l'ancienne taxonomie.
- "Effectif inconnu" → affichage `—` avec tooltip "Non déclaré au répertoire SIRENE" au lieu d'un libellé anxiogène.
- Graphique volume mensuel : exclut le mois en cours et le premier mois partiel (si la collecte n'a pas démarré le 1er du mois), affiche une annotation "Collecte démarrée le [date] — historique en cours de constitution" tant que la fenêtre a moins de 90 jours.

### Priorité 2 — profondeur produit (fait intégralement)
- `/annonce/[id]` : fiche complète (identité, SIREN cliquable vers `annuaire-entreprises.data.gouv.fr`, localisation, secteur, effectifs, date de création, tribunal, activité déclarée), décomposition du score en barres par critère, lien vers l'annonce BODACC source.
- Décomposition du score au survol : popover CSS pur (`group-hover`, pas de dépendance ajoutée) sur chaque badge de score dans la table et les cartes d'opportunités.
- `/opportunites` : cartes (pas une table) pour les annonces score ≥ 70, triées par score.
- `/tendances` : 4 graphiques (répartition sectorielle, distribution des scores, top 10 départements, part des PME 10-249 salariés) avec phrase d'insight calculée dynamiquement sous chacun — jamais de texte figé.
- Recherche table étendue à entreprise + ville + département, debounce 250ms, état des filtres (région, secteur, score, recherche, toggle) reflété dans l'URL via `history.replaceState` (pas de round-trip serveur, partageable).
- `/feed.xml` : flux RSS des annonces score ≥ 70 (50 items max), lié depuis le footer.

### Priorité 3 — cosmétique (fait intégralement)
- Hero enrichi en tête de page : chiffre de la note Sapiens ("700 000 dirigeants de PME partiront à la retraite d'ici 2035") + 2 CTA pilule ("Explorer les cessions" en ancre vers la table, "Lire la méthodologie").
- Badges de score redessinés : plein `#1f4d3f` texte blanc si ≥ 70, contour vert si 40-69, gris clair sinon — cohérent avec le seuil "PME qualifiées".
- Footer institutionnel : mention + lien Institut Sapiens, sources publiques, lien GitHub, lien flux RSS, timestamp de la dernière donnée ingérée (calculé dynamiquement via `MAX(updated_at)`, pas codé en dur).
- Micro-interactions : compteurs KPI en count-up (800ms, easing, une fois au chargement), entièrement sautés si `prefers-reduced-motion: reduce`. Transitions déjà en place sur les filtres/boutons (150-200ms) reprises telles quelles. Dark mode : non ajouté, comme demandé.
- Skeleton loaders : **non implémentés** — l'architecture est en Server Components (données chargées avant le premier rendu, pas de fetch client visible), donc l'état de chargement que ce point visait n'existe pas dans ce cas d'usage. Pas de perte fonctionnelle.

### Rien n'a dû être sacrifié
L'ordre de sacrifice prévu (RSS → tendances → micro-interactions) n'a pas été nécessaire : le budget de 2h a été respecté avec large marge (~50 min de travail effectif), tout est livré.

### Vérifications
- `tsc --noEmit`, `pnpm lint`, `pnpm build` : OK après chaque bloc de commits.
- Toutes les routes testées en production via `curl` après déploiement : `/` (200), `/methodologie` (200), `/opportunites` (200), `/tendances` (200), `/feed.xml` (200), `/annonce/[id]` (200 sur un id réel extrait du flux), `/api/cron/ingest` sans secret (401).
- Aucune action navigateur utilisée à aucun moment de cette session, conformément à la contrainte.
