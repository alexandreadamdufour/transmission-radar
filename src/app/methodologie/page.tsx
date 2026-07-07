import Link from "next/link";

export const metadata = {
  title: "Méthodologie — Transmission Radar",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{children}</div>
    </section>
  );
}

export default function Methodologie() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Méthodologie</h1>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <Section title="Sources de données">
          <p>
            <strong>BODACC</strong> (Bulletin officiel des annonces civiles et commerciales), via l&apos;API
            Opendatasoft de la DILA — dataset <code>annonces-commerciales</code>, filtré sur la famille
            d&apos;avis « Ventes et cessions ». C&apos;est la source primaire des annonces de cession.
          </p>
          <p>
            <strong>SIRENE</strong>, via <code>recherche-entreprises.api.gouv.fr</code>, interrogée par SIREN
            pour enrichir chaque annonce avec le code NAF, la tranche d&apos;effectifs et la date de création de
            l&apos;entreprise. Les appels sont limités à ~5 requêtes/seconde.
          </p>
          <p>Aucun scraping : uniquement des API publiques.</p>
        </Section>

        <Section title="Score d'opportunité (0-100)">
          <p>
            Chaque cession enrichie reçoit un score calculé au moment de l&apos;ingestion, combinant quatre
            critères :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Taille (35 pts max)</strong> — effectifs dans la fourchette PME cible (10 à 249 salariés),
              avec un pic à 35 pts pour 20-49 salariés.
            </li>
            <li>
              <strong>Ancienneté (25 pts max)</strong> — 25 pts pour une entreprise de plus de 15 ans, dégressif
              en dessous (15 pts entre 10 et 15 ans, 5 pts entre 5 et 10 ans, 0 en dessous de 5 ans).
            </li>
            <li>
              <strong>Secteur (25 pts max)</strong> — 25 pts pour l&apos;industrie, 20 pts pour le BTP, 15 pts
              pour le commerce de gros (NAF 46.x), 5 pts pour les autres secteurs identifiés.
            </li>
            <li>
              <strong>Région (15 pts max)</strong> — 15 pts hors Île-de-France, 5 pts en Île-de-France : la
              dynamique de transmission décrite dans la note Institut Sapiens est particulièrement marquée en
              région.
            </li>
          </ul>
          <p>
            Une annonce dont l&apos;enrichissement SIRENE échoue (SIREN introuvable, entreprise radiée, etc.)
            n&apos;a pas de score et apparaît comme « N/A » dans le tableau.
          </p>
        </Section>

        <Section title="Architecture">
          <p>
            Table Supabase unique <code>cessions</code>, sans normalisation multi-table. Un script
            d&apos;ingestion autonome effectue le backfill historique ; une route Vercel Cron protégée par un
            secret (<code>CRON_SECRET</code>) relance l&apos;ingestion quotidiennement sur une fenêtre glissante
            de quelques jours pour absorber les délais de publication du BODACC.
          </p>
          <p>Le score est calculé une fois, à l&apos;ingestion — jamais recalculé côté client.</p>
        </Section>

        <Section title="Limites connues">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Le backfill historique couvre une fenêtre de 90 jours plutôt que 12 mois, pour respecter le
              fair-use de l&apos;API SIRENE (~5 req/s) dans le temps imparti au projet.
            </li>
            <li>
              Une partie des annonces BODACC ne comporte pas de SIREN exploitable (entrepreneurs individuels,
              formats d&apos;avis anciens) : ces lignes restent non enrichies et sans score.
            </li>
            <li>Le score est un indicateur heuristique, pas une évaluation financière.</li>
          </ul>
        </Section>
      </main>
    </div>
  );
}
