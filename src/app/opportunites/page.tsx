import Link from "next/link";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { effectifsLabel, formatDate } from "@/lib/format";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 3600;

export const metadata = {
  title: "Opportunités",
};

const THRESHOLD = 70;

export default async function Opportunites() {
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);
  const opportunities = rows.filter((r) => (r.score ?? 0) >= THRESHOLD).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/tendances" className="hover:text-ink">
              Tendances
            </Link>
            <Link
              href="/"
              className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-ink hover:bg-ink hover:text-white"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 pb-20">
          <h1 className="font-serif-display text-[44px] leading-[1.05] tracking-[-0.66px] text-ink">
            Opportunités
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Les cibles de reprise les plus qualifiées du moment — score ≥ {THRESHOLD}, triées par pertinence.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((r) => (
              <Link
                key={r.id}
                href={`/annonce/${r.id}`}
                className="block rounded-[24px] bg-nested p-6 transition-filters hover:bg-ink/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-tertiary">{r.naf_label ?? "Secteur non enrichi"}</p>
                  <ScoreBadge score={r.score} details={r.score_details} />
                </div>
                <p className="mt-3 text-lg font-medium text-ink">{r.denomination ?? "Entreprise non nommée"}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.ville ?? "—"} · {r.region_nom ?? "—"}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-tertiary">
                  <span className="tabular">{effectifsLabel(r.effectifs)}</span>
                  <span className="tabular">{formatDate(r.date_parution)}</span>
                </div>
              </Link>
            ))}
          </div>

          {opportunities.length === 0 && (
            <p className="mt-10 text-sm text-tertiary">
              Aucune opportunité au-dessus du seuil pour le moment — revenez après la prochaine collecte.
            </p>
          )}
        </div>
      </section>

      <SiteFooter lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}
