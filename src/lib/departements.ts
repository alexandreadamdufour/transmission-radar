import type { CessionRow } from "./data";

export type DeptStats = {
  code: string;
  nom: string;
  count: number;
  avgScore: number | null;
  strongCount: number;
  topSecteur: string | null;
};

export function computeDeptStats(rows: CessionRow[]): Map<string, DeptStats> {
  const byCode = new Map<
    string,
    { nom: string; count: number; scoreSum: number; scoreCount: number; strongCount: number; secteurs: Map<string, number> }
  >();

  for (const r of rows) {
    if (!r.departement) continue;
    if (!byCode.has(r.departement)) {
      byCode.set(r.departement, {
        nom: r.departement_nom ?? r.departement,
        count: 0,
        scoreSum: 0,
        scoreCount: 0,
        strongCount: 0,
        secteurs: new Map(),
      });
    }
    const entry = byCode.get(r.departement)!;
    entry.count += 1;
    if (r.score != null) {
      entry.scoreSum += r.score;
      entry.scoreCount += 1;
      if (r.score >= 70) entry.strongCount += 1;
    }
    if (r.naf_label) entry.secteurs.set(r.naf_label, (entry.secteurs.get(r.naf_label) ?? 0) + 1);
  }

  const result = new Map<string, DeptStats>();
  for (const [code, entry] of byCode) {
    const topSecteur = [...entry.secteurs.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
    result.set(code, {
      code,
      nom: entry.nom,
      count: entry.count,
      avgScore: entry.scoreCount ? Math.round(entry.scoreSum / entry.scoreCount) : null,
      strongCount: entry.strongCount,
      topSecteur,
    });
  }
  return result;
}

export function isDomTom(code: string): boolean {
  return code.startsWith("97") || code.startsWith("98");
}
