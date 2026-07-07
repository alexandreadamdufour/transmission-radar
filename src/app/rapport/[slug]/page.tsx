import Link from "next/link";
import { notFound } from "next/navigation";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { buildMonthlyReport } from "@/lib/reports";
import { AnalysisBarChart } from "@/components/AnalysisBarChart";
import { SiteFooter } from "@/components/SiteFooter";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await getCessions();
  const report = buildMonthlyReport(rows, slug);
  if (!report) return { title: "Rapport" };
  return {
    title: `Rapport ${report.label}`,
    description: `${report.count} cessions de PME suivies en ${report.label} — score moyen ${report.avgScore ?? "N/A"}.`,
  };
}

export default async function RapportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);
  const report = buildMonthlyReport(rows, slug);
  if (!report) notFound();

  const delta =
    report.countPrevMonth > 0 ? Math.round(((report.count - report.countPrevMonth) / report.countPrevMonth) * 100) : null;

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <header className="bg-canvas print:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
          <nav className="flex items-center gap-4">
            <Link href="/rapports" className="text-sm font-medium text-muted hover:text-ink">
              Tous les rapports
            </Link>
            <Link
              href="/"
              className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-12 px-6 pb-24 print:space-y-6 print:px-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-tertiary">Rapport mensuel</p>
            <h1 className="font-serif-display mt-1 text-[44px] capitalize leading-[1.05] tracking-[-0.66px] text-ink print:text-3xl">
              {report.label}
            </h1>
          </div>
          <div className="print:hidden">
            <CopyLinkButton />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Cessions du mois</p>
            <p className="tabular mt-2 text-3xl font-medium text-ink">{report.count}</p>
            {delta != null && (
              <p className="tabular mt-1 text-xs text-muted">
                {delta > 0 ? "+" : ""}
                {delta}% vs mois précédent
              </p>
            )}
          </div>
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Score moyen</p>
            <p className="tabular mt-2 text-3xl font-medium text-ink">{report.avgScore ?? "—"}</p>
            {report.avgScorePrevMonth != null && (
              <p className="tabular mt-1 text-xs text-muted">contre {report.avgScorePrevMonth} le mois précédent</p>
            )}
          </div>
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Département en tête</p>
            <p className="mt-2 text-2xl font-medium text-ink">{report.topDepartements[0]?.label ?? "—"}</p>
          </div>
        </div>

        <div className="rounded-[24px] bg-nested p-8 print:border print:border-ink/10">
          <h2 className="font-serif-display text-2xl text-ink">Analyse</h2>
          <ul className="mt-4 space-y-2">
            {report.insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="text-accent">—</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-[24px] bg-nested p-6">
            <h3 className="text-sm font-medium text-tertiary">Top 5 départements</h3>
            <div className="mt-4">
              <AnalysisBarChart data={report.topDepartements} />
            </div>
          </div>
          <div className="rounded-[24px] bg-nested p-6">
            <h3 className="text-sm font-medium text-tertiary">Mix sectoriel</h3>
            <div className="mt-4">
              <AnalysisBarChart data={report.sectorMix.slice(0, 8)} />
            </div>
          </div>
          <div className="rounded-[24px] bg-nested p-6 lg:col-span-2">
            <h3 className="text-sm font-medium text-tertiary">Distribution des scores</h3>
            <div className="mt-4">
              <AnalysisBarChart data={report.scoreHistogram} />
            </div>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter lastUpdatedAt={lastUpdatedAt} />
      </div>
    </div>
  );
}
