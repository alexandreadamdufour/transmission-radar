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

function weekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-${String(week).padStart(2, "0")}`;
}

function weeklySeries<T>(rows: T[], dateOf: (r: T) => string, value: (r: T[]) => number, weeks = 10) {
  const buckets = new Map<string, T[]>();
  for (const r of rows) {
    const key = weekKey(dateOf(r));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weeks)
    .map(([, items]) => ({ value: value(items) }));
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

  const volumeTrend = weeklySeries(rows, (r) => r.date_parution, (items) => items.length);
  const scoreTrend = weeklySeries(
    rows.filter((r) => r.score != null),
    (r) => r.date_parution,
    (items) => Math.round(items.reduce((s, r) => s + (r.score ?? 0), 0) / items.length)
  );
  const opportunityTrend = weeklySeries(
    rows,
    (r) => r.date_parution,
    (items) => items.filter((r) => (r.score ?? 0) >= 70).length
  );

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <div>
            <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
            <h1 className="font-serif-display mt-1 text-[44px] leading-[1.05] tracking-[-0.66px] text-ink">
              Transmission Radar
            </h1>
          </div>
          <Link
            href="/methodologie"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            Méthodologie
          </Link>
        </div>
      </header>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 pb-20">
          <p className="max-w-2xl text-lg text-muted">
            Suivi public des cessions de PME françaises — BODACC × SIRENE, scoré et mis à jour chaque jour.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Cessions suivies"
              value={rows.length.toLocaleString("fr-FR")}
              hint="fenêtre en base"
              trend={volumeTrend}
            />
            <KpiCard label="Ce mois-ci" value={cessionsThisMonth.toLocaleString("fr-FR")} trend={volumeTrend} />
            <KpiCard
              label="Score moyen"
              value={avgScore != null ? String(avgScore) : "N/A"}
              hint={`${scored.length.toLocaleString("fr-FR")} annonces enrichies`}
              trend={scoreTrend}
            />
            <KpiCard
              label="Opportunités fortes"
              value={strongOpportunities.toLocaleString("fr-FR")}
              hint="score ≥ 70"
              trend={opportunityTrend}
            />
          </div>
        </div>
      </section>

      <section className="bg-section-alt">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-serif-display text-[32px] leading-tight tracking-[-0.4px] text-ink">
            Où et quand ça se passe
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MonthlyVolumeChart data={monthlyVolume} />
            <RegionalChart data={regionalBreakdown} />
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-serif-display text-[32px] leading-tight tracking-[-0.4px] text-ink">
            Les annonces
          </h2>
          <div className="mt-8">
            <CessionsTable rows={rows} regions={regions} secteurs={secteurs} />
          </div>
        </div>
      </section>

      <footer className="bg-section-alt">
        <div className="mx-auto max-w-[1200px] px-6 py-12 text-center text-xs text-tertiary">
          Données publiques BODACC (Opendatasoft) et SIRENE (recherche-entreprises.api.gouv.fr). Companion tool de la
          note Institut Sapiens « La vague de transmission des PME françaises (2025-2035) ».
        </div>
      </footer>
    </div>
  );
}
