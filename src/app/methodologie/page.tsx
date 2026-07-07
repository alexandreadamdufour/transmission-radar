import Link from "next/link";

export const metadata = {
  title: "Méthodologie",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-serif-display text-2xl text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Methodologie() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <h1 className="font-serif-display text-[32px] tracking-[-0.4px] text-ink">Méthodologie</h1>
          <Link
            href="/"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] space-y-20 px-6 pb-24 pt-4">
        <Section title="Sources de données">
          <p>
            <strong className="text-ink">BODACC</strong> (Bulletin officiel des annonces civiles et commerciales),
            via l&apos;API Opendatasoft de la DILA — dataset <code>annonces-commerciales</code>, filtré sur la
            famille d&apos;avis « Ventes et cessions ». C&apos;est la source primaire des annonces de cession.
          </p>
          <p>
            <strong className="text-ink">SIRENE</strong>, via <code>recherche-entreprises.api.gouv.fr</code>,
            interrogée par SIREN pour enrichir chaque annonce avec le code NAF, la tranche d&apos;effectifs et la
            date de création de l&apos;entreprise. Les appels sont limités à ~5 requêtes/seconde.
          </p>
          <p>Aucun scraping : uniquement des API publiques.</p>
        </Section>

        <div
          className="rounded-[24px] px-8 py-10 text-white"
          style={{ background: "#1f4d3f" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Note Institut Sapiens</p>
          <p className="font-serif-display mt-4 text-2xl leading-snug">
            Une génération entière de dirigeants de PME approche de la retraite entre 2025 et 2035 — sans qu&apos;un
            repreneur soit toujours identifié. C&apos;est cette vague de transmission, largement invisible faute
            d&apos;outil de suivi, que Transmission Radar rend lisible en temps réel.
          </p>
        </div>

        <Section title="Score d'opportunité (0-100)">
          <p>
            Chaque cession enrichie reçoit un score calculé au moment de l&apos;ingestion, combinant quatre
            critères :
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-ink">Taille (35 pts max)</strong> — effectifs dans la fourchette PME cible
              (10 à 249 salariés), avec un pic à 35 pts pour 20-49 salariés.
            </li>
            <li>
              <strong className="text-ink">Ancienneté (25 pts max)</strong> — 25 pts pour une entreprise de plus
              de 15 ans, dégressif en dessous (15 pts entre 10 et 15 ans, 5 pts entre 5 et 10 ans, 0 en dessous de
              5 ans).
            </li>
            <li>
              <strong className="text-ink">Secteur (25 pts max)</strong> — 25 pts pour l&apos;industrie, 20 pts
              pour le BTP, 15 pts pour le commerce de gros (NAF 46.x), 5 pts pour les autres secteurs identifiés.
            </li>
            <li>
              <strong className="text-ink">Région (15 pts max)</strong> — 15 pts hors Île-de-France, 5 pts en
              Île-de-France : la dynamique de transmission décrite dans la note Institut Sapiens est
              particulièrement marquée en région.
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
