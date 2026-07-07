import type { CessionRow } from "./data";

export type RegionStats = {
  nom: string;
  count: number;
  avgScore: number | null;
  sectorCounts: Record<string, number>;
};

export function computeRegionStats(rows: CessionRow[]): RegionStats[] {
  const byRegion = new Map<
    string,
    { count: number; scoreSum: number; scoreCount: number; sectors: Map<string, number> }
  >();

  for (const r of rows) {
    if (!r.region_nom) continue;
    if (!byRegion.has(r.region_nom)) {
      byRegion.set(r.region_nom, { count: 0, scoreSum: 0, scoreCount: 0, sectors: new Map() });
    }
    const entry = byRegion.get(r.region_nom)!;
    entry.count += 1;
    if (r.score != null) {
      entry.scoreSum += r.score;
      entry.scoreCount += 1;
    }
    if (r.naf_label) entry.sectors.set(r.naf_label, (entry.sectors.get(r.naf_label) ?? 0) + 1);
  }

  return [...byRegion.entries()]
    .map(([nom, e]) => ({
      nom,
      count: e.count,
      avgScore: e.scoreCount ? Math.round(e.scoreSum / e.scoreCount) : null,
      sectorCounts: Object.fromEntries(e.sectors),
    }))
    .sort((a, b) => b.count - a.count);
}
