import Link from "next/link";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { computeDeptStats } from "@/lib/departements";
import { computeRegionStats } from "@/lib/regions";
import { AnalysisBarChart } from "@/components/AnalysisBarChart";
import { FranceSmallMultiples } from "@/components/FranceSmallMultiples";
import { RegionComparator } from "@/components/RegionComparator";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 3600;

export const metadata = {
  title: "Tendances",
};

function AnalysisCard({
  title,
  insight,
  data,
}: {
  title: string;
  insight: string;
  data: { label: string; count: number }[];
}) {
  return (
    <div className="rounded-[24px] bg-nested p-6">
      <h3 className="text-sm font-medium text-tertiary">{title}</h3>
      <div className="mt-4">
        <AnalysisBarChart data={data} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{insight}</p>
    </div>
  );
}

export default async function Tendances() {
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);

  const bySector = new Map<string, number>();
  for (const r of rows) bySector.set(r.naf_label ?? "Non enrichi", (bySector.get(r.naf_label ?? "Non enrichi") ?? 0) + 1);
  const sectorData = [...bySector.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));
  const topSector = sectorData[0];
  const topSectorShare = topSector ? Math.round((topSector.count / rows.length) * 100) : 0;

  const scoreBuckets = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"];
  const scored = rows.filter((r) => r.score != null);
  const scoreHistogram = scoreBuckets.map((label, i) => {
    const lo = i * 10;
    const hi = i === scoreBuckets.length - 1 ? 101 : lo + 10;
    return { label, count: scored.filter((r) => (r.score ?? -1) >= lo && (r.score ?? -1) < hi).length };
  });
  const strongShare = scored.length ? Math.round((scored.filter((r) => (r.score ?? 0) >= 70).length / scored.length) * 100) : 0;

  const byDept = new Map<string, number>();
  for (const r of rows) {
    if (!r.departement_nom) continue;
    byDept.set(r.departement_nom, (byDept.get(r.departement_nom) ?? 0) + 1);
  }
  const deptData = [...byDept.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([label, count]) => ({ label, count }));
  const topDept = deptData[0];

  const headcountBuckets: { label: string; codes: string[] }[] = [
    { label: "< 10 sal.", codes: ["00", "01", "02", "03"] },
    { label: "10-49 sal.", codes: ["11", "12"] },
    { label: "50-249 sal.", codes: ["21", "22", "31"] },
    { label: "250+ sal.", codes: ["32", "41", "42", "51", "52", "53"] },
    { label: "Inconnu", codes: [] },
  ];
  const headcountData = headcountBuckets.map((b) => ({
    label: b.label,
    count:
      b.label === "Inconnu"
        ? rows.filter((r) => !r.effectifs || r.effectifs === "NN").length
        : rows.filter((r) => r.effectifs && b.codes.includes(r.effectifs)).length,
  }));
  const coreSmeShare = Math.round(
    ((headcountData[1]?.count ?? 0) + (headcountData[2]?.count ?? 0)) / (rows.length || 1) * 100
  );

  const deptStats = [...computeDeptStats(rows).values()];
  const regionStats = computeRegionStats(rows);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-8">
          <p className="text-sm font-medium text-tertiary">Institut Sapiens · La vague de transmission</p>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted">
            <Link href="/opportunites" className="hover:text-ink">
              Opportunités
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
          <h1 className="font-serif-display text-[44px] leading-[1.05] tracking-[-0.66px] text-ink">Tendances</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Lecture analytique du flux de cessions suivi par Transmission Radar.
          </p>

          <div className="mt-10 rounded-[24px] bg-nested p-6">
            <h2 className="text-sm font-medium text-tertiary">Petits multiples — lecture comparative</h2>
            <div className="mt-4">
              <FranceSmallMultiples stats={deptStats} />
            </div>
          </div>

          {regionStats.length >= 2 && (
            <div className="mt-6">
              <RegionComparator regions={regionStats} />
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnalysisCard
              title="Répartition par famille sectorielle"
              data={sectorData}
              insight={
                topSector
                  ? `« ${topSector.label} » domine le flux avec ${topSectorShare}% des cessions suivies — cohérent avec la structure du tissu de PME françaises proche de la retraite.`
                  : "Pas encore assez de données enrichies pour dégager une tendance sectorielle."
              }
            />
            <AnalysisCard
              title="Distribution des scores d'opportunité"
              data={scoreHistogram}
              insight={`${strongShare}% des annonces enrichies affichent un score ≥ 70 — la majorité du flux reste composée de cessions de petite taille ou hors cœur de cible PME.`}
            />
            <AnalysisCard
              title="Top 10 départements"
              data={deptData}
              insight={
                topDept
                  ? `${topDept.label} concentre le plus de cessions suivies (${topDept.count}) sur la fenêtre actuelle — à lire avec prudence tant que l'historique se constitue.`
                  : "Pas encore assez de données pour un classement départemental."
              }
            />
            <AnalysisCard
              title="Part des PME 10-249 salariés dans le flux"
              data={headcountData}
              insight={`${coreSmeShare}% des cessions suivies concernent des entreprises de 10 à 249 salariés — le cœur de cible de la note Institut Sapiens sur la transmission des PME.`}
            />
          </div>
        </div>
      </section>

      <SiteFooter lastUpdatedAt={lastUpdatedAt} />
    </div>
  );
}
