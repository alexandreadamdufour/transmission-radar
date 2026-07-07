import Link from "next/link";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { computeDeptStats } from "@/lib/departements";
import { KpiCard } from "@/components/KpiCard";
import { MonthlyVolumeChart } from "@/components/MonthlyVolumeChart";
import { RegionalChart } from "@/components/RegionalChart";
import { CessionsTable } from "@/components/CessionsTable";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { FranceMapLoader } from "@/components/FranceMapLoader";

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
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const cessionsThisMonth = rows.filter((r) => monthKey(r.date_parution) === currentMonthKey).length;

  const scored = rows.filter((r) => r.score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;
  const strongOpportunities = rows.filter((r) => (r.score ?? 0) >= 70).length;

  const earliestDate = rows.reduce<string | null>(
    (min, r) => (min === null || r.date_parution < min ? r.date_parution : min),
    null
  );
  const collectionStartKey = earliestDate ? monthKey(earliestDate) : null;
  const collectionStartIsPartialMonth = earliestDate ? new Date(earliestDate).getDate() > 1 : false;
  const daysSinceCollectionStart = earliestDate
    ? Math.round((now.getTime() - new Date(earliestDate).getTime()) / 86400000)
    : 0;
  const collectionStillRampingUp = daysSinceCollectionStart < 90;

  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const key = monthKey(r.date_parution);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const monthlyVolume = [...byMonth.entries()]
    .filter(([key]) => {
      if (key === currentMonthKey) return false; // mois en cours : jamais complet
      if (collectionStartIsPartialMonth && key === collectionStartKey) return false; // premier mois partiel
      return true;
    })
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

  const deptStats = [...computeDeptStats(rows).values()].sort((a, b) => b.count - a.count);

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
          <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/opportunites" className="hover:text-ink">
              Opportunités
            </Link>
            <Link href="/tendances" className="hover:text-ink">
              Tendances
            </Link>
            <Link
              href="/methodologie"
              className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-ink hover:bg-ink hover:text-white"
            >
              Méthodologie
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 pb-20">
          <h1 className="font-serif-display max-w-3xl text-[44px] leading-[1.05] tracking-[-0.66px] text-ink">
            700 000 dirigeants de PME partiront à la retraite d&apos;ici 2035.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            Transmission Radar rend cette vague lisible en temps réel : les cessions de PME françaises, repérées sur
            le BODACC, enrichies via la SIRENE, et scorées chaque jour.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#annonces"
              className="transition-filters rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:opacity-85"
            >
              Explorer les cessions
            </a>
            <Link
              href="/methodologie"
              className="transition-filters rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white"
            >
              Lire la méthodologie
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Cessions suivies"
              value={rows.length.toLocaleString("fr-FR")}
              animateTo={rows.length}
              hint="fenêtre en base"
              trend={volumeTrend}
            />
            <KpiCard
              label="Ce mois-ci"
              value={cessionsThisMonth.toLocaleString("fr-FR")}
              animateTo={cessionsThisMonth}
              trend={volumeTrend}
            />
            <KpiCard
              label="Score moyen"
              value={avgScore != null ? String(avgScore) : "N/A"}
              animateTo={avgScore ?? undefined}
              hint={`${scored.length.toLocaleString("fr-FR")} annonces enrichies`}
              trend={scoreTrend}
            />
            <KpiCard
              label="Opportunités fortes"
              value={strongOpportunities.toLocaleString("fr-FR")}
              animateTo={strongOpportunities}
              hint="score ≥ 70"
              trend={opportunityTrend}
            />
          </div>
        </div>
      </section>

      <section className="bg-section-alt">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <Reveal>
            <h2 className="font-serif-display text-[32px] leading-tight tracking-[-0.4px] text-ink">
              Où la vague frappe
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Intensité des cessions par département, sur la fenêtre suivie par Transmission Radar.
            </p>
            <div className="mt-8 rounded-[24px] bg-nested p-6">
              <FranceMapLoader stats={deptStats} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <Reveal>
            <h2 className="font-serif-display text-[32px] leading-tight tracking-[-0.4px] text-ink">
              Où et quand ça se passe
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MonthlyVolumeChart
                data={monthlyVolume}
                note={
                  collectionStillRampingUp && earliestDate
                    ? `Collecte démarrée le ${new Date(earliestDate).toLocaleDateString("fr-FR")} — historique en cours de constitution.`
                    : undefined
                }
              />
              <RegionalChart data={regionalBreakdown} />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="annonces" className="scroll-mt-8 bg-section-alt">
        <div className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="font-serif-display text-[32px] leading-tight tracking-[-0.4px] text-ink">
            Les annonces
          </h2>
          <div className="mt-8">
            <CessionsTable rows={rows} regions={regions} secteurs={secteurs} />
          </div>
        </div>
      </section>

      <SiteFooter lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}
