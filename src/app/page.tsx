import Link from "next/link";
import { getCessions } from "@/lib/data";
import { KpiCard } from "@/components/KpiCard";
import { MonthlyVolumeChart } from "@/components/MonthlyVolumeChart";
import { RegionalChart } from "@/components/RegionalChart";
import { CessionsTable } from "@/components/CessionsTable";

export const revalidate = 3600;

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export default async function Home() {
  const rows = await getCessions();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const cessionsThisMonth = rows.filter((r) => monthKey(r.date_parution) === currentMonthKey).length;

  const scored = rows.filter((r) => r.score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;
  const strongOpportunities = rows.filter((r) => (r.score ?? 0) >= 70).length;

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = monthKey(r.date_parution);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const monthlyVolume = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, count]) => ({ month: monthLabel(key), count }));

  const byRegion = new Map<string, number>();
  for (const r of rows) {
    if (!r.region_nom) continue;
    byRegion.set(r.region_nom, (byRegion.get(r.region_nom) ?? 0) + 1);
  }
  const regionalBreakdown = [...byRegion.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([region, count]) => ({ region, count }));

  const regions = [...new Set(rows.map((r) => r.region_nom).filter((v): v is string => Boolean(v)))].sort();
  const secteurs = [...new Set(rows.map((r) => r.naf_label).filter((v): v is string => Boolean(v)))].sort();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Transmission Radar</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Suivi public des cessions de PME françaises — BODACC × SIRENE
            </p>
          </div>
          <Link
            href="/methodologie"
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Méthodologie →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Cessions suivies" value={rows.length.toLocaleString("fr-FR")} hint="fenêtre en base" />
          <KpiCard label="Ce mois-ci" value={cessionsThisMonth.toLocaleString("fr-FR")} />
          <KpiCard
            label="Score moyen"
            value={avgScore != null ? String(avgScore) : "N/A"}
            hint={`${scored.length.toLocaleString("fr-FR")} annonces enrichies`}
          />
          <KpiCard label="Opportunités fortes" value={strongOpportunities.toLocaleString("fr-FR")} hint="score ≥ 70" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MonthlyVolumeChart data={monthlyVolume} />
          <RegionalChart data={regionalBreakdown} />
        </div>

        <CessionsTable rows={rows} regions={regions} secteurs={secteurs} />
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-zinc-400">
        Données publiques BODACC (Opendatasoft) et SIRENE (recherche-entreprises.api.gouv.fr). Companion tool de la
        note Institut Sapiens « La vague de transmission des PME françaises (2025-2035) ».
      </footer>
    </div>
  );
}
