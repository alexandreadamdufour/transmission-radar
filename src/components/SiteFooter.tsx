function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "en attente de la première ingestion";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function SiteFooter({ lastUpdatedAt }: { lastUpdatedAt: string | null }) {
  return (
    <footer className="bg-section-alt">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="font-serif-display text-lg text-ink">Transmission Radar</p>
            <p className="mt-2 text-xs leading-relaxed text-tertiary">
              Compagnon de la note{" "}
              <a href="https://www.institutsapiens.fr" target="_blank" rel="noopener noreferrer" className="text-muted hover:underline">
                Institut Sapiens
              </a>{" "}
              « La vague de transmission des PME françaises (2025-2035) ». Données publiques BODACC (Opendatasoft)
              et SIRENE (recherche-entreprises.api.gouv.fr) — aucun scraping.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-tertiary sm:items-end">
            <a
              href="https://github.com/alexandreadamdufour/transmission-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:underline"
            >
              Code source sur GitHub
            </a>
            <a href="/feed.xml" className="text-muted hover:underline">
              Flux RSS des opportunités fortes
            </a>
            <p className="tabular">Mis à jour quotidiennement à 4h — dernière donnée : {formatUpdatedAt(lastUpdatedAt)}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
