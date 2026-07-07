import Link from "next/link";

export const metadata = { title: "API" };

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({ method, path, description, example }: { method: string; path: string; description: string; example: string }) {
  return (
    <div className="rounded-[24px] bg-nested p-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">{method}</span>
        <code className="tabular text-sm text-ink">{path}</code>
      </div>
      <p className="mt-3 text-sm text-muted">{description}</p>
      <Code>{example}</Code>
    </div>
  );
}

export default function ApiDoc() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <h1 className="font-serif-display text-[32px] tracking-[-0.4px] text-ink">API</h1>
          <Link
            href="/"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] space-y-8 px-6 pb-24">
        <p className="text-muted">
          API publique en lecture seule, sans clé requise. Données publiques BODACC × SIRENE — si vous les
          réutilisez, merci de citer <strong className="text-ink">Transmission Radar — Institut Sapiens</strong>.
          Rate limit : 60 requêtes/minute par IP. CORS ouvert.
        </p>

        <Endpoint
          method="GET"
          path="/api/v1/cessions"
          description="Liste paginée des cessions. Filtres : region, dept, famille, score_min, date_from, date_to (YYYY-MM-DD), page, per_page (max 100)."
          example={`curl "https://transmission-radar.vercel.app/api/v1/cessions?region=Bretagne&score_min=70&per_page=10"`}
        />

        <Endpoint
          method="GET"
          path="/api/v1/stats"
          description="Agrégats mensuels (nombre de cessions, score moyen) sur la fenêtre de données retenue."
          example={`curl "https://transmission-radar.vercel.app/api/v1/stats"`}
        />

        <div className="rounded-[24px] bg-nested p-6">
          <h2 className="font-serif-display text-xl text-ink">Réponse type — /api/v1/cessions</h2>
          <Code>{`{
  "data": [
    {
      "id": "…",
      "date_parution": "2026-07-01",
      "denomination": "…",
      "ville": "…",
      "departement": "35",
      "departement_nom": "Ille-et-Vilaine",
      "region_nom": "Bretagne",
      "naf_code": "46.39B",
      "naf_label": "Commerce de gros",
      "effectifs": "12",
      "score": 78,
      "url_bodacc": "https://…"
    }
  ],
  "page": 1,
  "per_page": 10,
  "total": 214,
  "source": "BODACC × SIRENE — Transmission Radar (Institut Sapiens)"
}`}</Code>
        </div>
      </main>
    </div>
  );
}
