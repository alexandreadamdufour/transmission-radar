import Link from "next/link";
import { notFound } from "next/navigation";
import { getCessions, getLastUpdatedAt } from "@/lib/data";
import { AnalysisBarChart } from "@/components/AnalysisBarChart";
import { CessionsTable } from "@/components/CessionsTable";
import { SiteFooter } from "@/components/SiteFooter";

export const revalidate = 3600;

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const rows = await getCessions();
  const local = rows.filter((r) => r.departement === code);
  if (local.length === 0) return { title: "Département" };
  const nom = local[0].departement_nom ?? code;
  return {
    title: `Cessions de PME en ${nom}`,
    description: `${local.length} cessions de PME suivies dans le département ${nom} (${code}) sur Transmission Radar.`,
  };
}

export default async function DepartementPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [rows, lastUpdatedAt] = await Promise.all([getCessions(), getLastUpdatedAt()]);
  const local = rows.filter((r) => r.departement === code);
  if (local.length === 0) notFound();

  const nom = local[0].departement_nom ?? code;
  const regionNom = local[0].region_nom;

  const scored = local.filter((r) => r.score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;
  const strongCount = local.filter((r) => (r.score ?? 0) >= 70).length;

  const nationalScored = rows.filter((r) => r.score != null);
  const nationalAvgScore = nationalScored.length
    ? Math.round(nationalScored.reduce((s, r) => s + (r.score ?? 0), 0) / nationalScored.length)
    : null;
  const shareOfNational = Math.round((local.length / rows.length) * 100);

  const byMonth = new Map<string, number>();
  for (const r of local) byMonth.set(monthKey(r.date_parution), (byMonth.get(monthKey(r.date_parution)) ?? 0) + 1);
  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, count]) => ({ label: monthLabel(key), count }));

  const bySector = new Map<string, number>();
  for (const r of local) bySector.set(r.naf_label ?? "Non enrichi", (bySector.get(r.naf_label ?? "Non enrichi") ?? 0) + 1);
  const sectorData = [...bySector.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const regions = [...new Set(local.map((r) => r.region_nom).filter((v): v is string => Boolean(v)))].sort();
  const secteurs = [...new Set(local.map((r) => r.naf_label).filter((v): v is string => Boolean(v)))].sort();

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <header className="bg-canvas print:hidden">
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

      <main className="mx-auto max-w-[1200px] space-y-14 px-6 pb-24 print:space-y-8 print:px-0">
        <div>
          <p className="text-sm font-medium text-tertiary">{regionNom ?? "France"} · Département {code}</p>
          <h1 className="font-serif-display mt-1 text-[44px] leading-[1.05] tracking-[-0.66px] text-ink print:text-3xl">
            {nom}
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Ce département concentre {shareOfNational}% des cessions suivies au niveau national
            {avgScore != null && nationalAvgScore != null && (
              <>
                {" "}
                — score moyen local de {avgScore}, contre {nationalAvgScore} au national.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Cessions suivies</p>
            <p className="tabular mt-2 text-3xl font-medium text-ink">{local.length}</p>
          </div>
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Score moyen</p>
            <p className="tabular mt-2 text-3xl font-medium text-ink">{avgScore ?? "—"}</p>
          </div>
          <div className="rounded-[24px] bg-nested p-6 print:border print:border-ink/10">
            <p className="text-sm font-medium text-tertiary">Opportunités ≥ 70</p>
            <p className="tabular mt-2 text-3xl font-medium text-ink">{strongCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 print:hidden">
          <div className="rounded-[24px] bg-nested p-6">
            <h3 className="text-sm font-medium text-tertiary">Évolution mensuelle</h3>
            <div className="mt-4">
              <AnalysisBarChart data={monthly} />
            </div>
          </div>
          <div className="rounded-[24px] bg-nested p-6">
            <h3 className="text-sm font-medium text-tertiary">Répartition sectorielle locale</h3>
            <div className="mt-4">
              <AnalysisBarChart data={sectorData} />
            </div>
          </div>
        </div>

        <div className="print:hidden">
          <h2 className="font-serif-display text-2xl text-ink">Les annonces du département</h2>
          <div className="mt-6">
            <CessionsTable rows={local} regions={regions} secteurs={secteurs} />
          </div>
        </div>

        <div className="hidden print:block">
          <h2 className="mt-8 text-lg font-medium text-ink">Annonces ({local.length})</h2>
          <table className="mt-4 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ink/20">
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2">Entreprise</th>
                <th className="py-1 pr-2">Ville</th>
                <th className="py-1 pr-2">Secteur</th>
                <th className="py-1">Score</th>
              </tr>
            </thead>
            <tbody>
              {local.slice(0, 100).map((r) => (
                <tr key={r.id} className="border-b border-ink/5">
                  <td className="py-1 pr-2">{r.date_parution}</td>
                  <td className="py-1 pr-2">{r.denomination ?? "—"}</td>
                  <td className="py-1 pr-2">{r.ville ?? "—"}</td>
                  <td className="py-1 pr-2">{r.naf_label ?? "—"}</td>
                  <td className="py-1">{r.score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter lastUpdatedAt={lastUpdatedAt} />
      </div>
    </div>
  );
}
