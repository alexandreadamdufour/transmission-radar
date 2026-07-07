export const EFFECTIFS_LABELS: Record<string, string> = {
  "00": "0 salarié",
  "01": "1-2 salariés",
  "02": "3-5 salariés",
  "03": "6-9 salariés",
  "11": "10-19 salariés",
  "12": "20-49 salariés",
  "21": "50-99 salariés",
  "22": "100-199 salariés",
  "31": "200-249 salariés",
  "32": "250-499 salariés",
  "41": "500-999 salariés",
  "42": "1000-1999 salariés",
  "51": "2000-4999 salariés",
  "52": "5000-9999 salariés",
  "53": "10000+ salariés",
};

const UNKNOWN_EFFECTIFS_TOOLTIP = "Non déclaré au répertoire SIRENE";

export function effectifsLabel(code: string | null): string {
  if (!code || code === "NN") return "—";
  return EFFECTIFS_LABELS[code] ?? code;
}

export function effectifsTooltip(code: string | null): string | undefined {
  if (!code || code === "NN") return UNKNOWN_EFFECTIFS_TOOLTIP;
  return undefined;
}

// >=10 salariés déclarés : tranches "11" à "53" (voir EFFECTIFS_LABELS).
export function hasQualifyingHeadcount(code: string | null): boolean {
  if (!code) return false;
  const n = Number(code);
  return !Number.isNaN(n) && n >= 11;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
}

export function scoreBand(score: number | null): "high" | "medium" | "low" | "none" {
  if (score == null) return "none";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}
