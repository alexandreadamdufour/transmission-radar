import Link from "next/link";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { monthSlug, parseMonthSlug, rowsInMonth } from "@/lib/reports";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 3600;

export const metadata = { title: "Rapports mensuels" };

export default async function RapportsIndex() {
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);

  const now = new Date();
  const currentSlug = monthSlug(now);

  const slugs = [...new Set(rows.map((r) => monthSlug(new Date(r.date_parution))))]
    .filter((s) => s !== currentSlug)
    .sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
          <Link
            href="/"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 pb-24">
          <h1 className="font-serif-display text-[44px] leading-[1.05] tracking-[-0.66px] text-ink">
            Rapports mensuels
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Un rapport auto-généré le 1er de chaque mois : volume, mix sectoriel, distribution des scores et
            analyse.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slugs.map((slug) => {
              const range = parseMonthSlug(slug);
              const count = rowsInMonth(rows, slug).length;
              return (
                <Link
                  key={slug}
                  href={`/rapport/${slug}`}
                  className="transition-filters rounded-[24px] bg-nested p-6 hover:bg-ink/[0.06]"
                >
                  <p className="font-serif-display text-xl capitalize text-ink">{range?.label ?? slug}</p>
                  <p className="tabular mt-1 text-sm text-muted">{count} cessions</p>
                </Link>
              );
            })}
          </div>

          {slugs.length === 0 && (
            <p className="mt-10 text-sm text-tertiary">Aucun rapport disponible pour le moment.</p>
          )}
        </div>
      </section>

      <SiteFooter lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}
