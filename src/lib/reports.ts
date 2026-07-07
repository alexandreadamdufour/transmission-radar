import type { CessionRow } from "./data";

export function monthSlug(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function previousMonthSlug(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() - 1, 1);
  return monthSlug(d);
}

export function parseMonthSlug(slug: string): { start: Date; end: Date; label: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(slug);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  const label = start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return { start, end, label };
}

export function rowsInMonth(rows: CessionRow[], slug: string): CessionRow[] {
  const range = parseMonthSlug(slug);
  if (!range) return [];
  return rows.filter((r) => {
    const d = new Date(r.date_parution);
    return d >= range.start && d < range.end;
  });
}

export type MonthlyReport = {
  slug: string;
  label: string;
  count: number;
  countPrevMonth: number;
  avgScore: number | null;
  avgScorePrevMonth: number | null;
  topDepartements: { label: string; count: number }[];
  sectorMix: { label: string; count: number }[];
  scoreHistogram: { label: string; count: number }[];
  insights: string[];
};

function avgScore(rows: CessionRow[]): number | null {
  const scored = rows.filter((r) => r.score != null);
  return scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;
}

function buildInsights(current: MonthlyReport["topDepartements"], count: number, prevCount: number, region: string | null): string[] {
  const insights: string[] = [];

  if (prevCount > 0) {
    const delta = Math.round(((count - prevCount) / prevCount) * 100);
    if (Math.abs(delta) >= 5) {
      insights.push(
        delta > 0
          ? `Le volume de cessions progresse de ${delta}% par rapport au mois précédent.`
          : `Le volume de cessions recule de ${Math.abs(delta)}% par rapport au mois précédent.`
      );
    } else {
      insights.push("Le volume de cessions reste stable par rapport au mois précédent.");
    }
  } else if (count > 0) {
    insights.push(`${count} cessions suivies ce mois-ci.`);
  }

  if (current[0]) {
    const share = count > 0 ? Math.round((current[0].count / count) * 100) : 0;
    insights.push(`${current[0].label} concentre à lui seul ${share}% des cessions du mois.`);
  }

  if (region) {
    insights.push(`${region} reste la région la plus active sur la fenêtre suivie par Transmission Radar.`);
  }

  return insights.slice(0, 3);
}

export function buildMonthlyReport(allRows: CessionRow[], slug: string): MonthlyReport | null {
  const range = parseMonthSlug(slug);
  if (!range) return null;

  const rows = rowsInMonth(allRows, slug);
  if (rows.length === 0) return null;

  const prevSlug = previousMonthSlug(range.start);
  const prevRows = rowsInMonth(allRows, prevSlug);

  const byDept = new Map<string, number>();
  for (const r of rows) {
    if (!r.departement_nom) continue;
    byDept.set(r.departement_nom, (byDept.get(r.departement_nom) ?? 0) + 1);
  }
  const topDepartements = [...byDept.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));

  const bySector = new Map<string, number>();
  for (const r of rows) bySector.set(r.naf_label ?? "Non enrichi", (bySector.get(r.naf_label ?? "Non enrichi") ?? 0) + 1);
  const sectorMix = [...bySector.entries()].sort(([, a], [, b]) => b - a).map(([label, count]) => ({ label, count }));

  const buckets = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"];
  const scored = rows.filter((r) => r.score != null);
  const scoreHistogram = buckets.map((label, i) => {
    const lo = i * 10;
    const hi = i === buckets.length - 1 ? 101 : lo + 10;
    return { label, count: scored.filter((r) => (r.score ?? -1) >= lo && (r.score ?? -1) < hi).length };
  });

  const byRegion = new Map<string, number>();
  for (const r of rows) if (r.region_nom) byRegion.set(r.region_nom, (byRegion.get(r.region_nom) ?? 0) + 1);
  const topRegion = [...byRegion.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  const report: MonthlyReport = {
    slug,
    label: range.label,
    count: rows.length,
    countPrevMonth: prevRows.length,
    avgScore: avgScore(rows),
    avgScorePrevMonth: avgScore(prevRows),
    topDepartements,
    sectorMix,
    scoreHistogram,
    insights: [],
  };
  report.insights = buildInsights(topDepartements, rows.length, prevRows.length, topRegion);

  return report;
}
