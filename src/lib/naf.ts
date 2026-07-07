// Maps a NAF/APE code (e.g. "46.39B") to one of ~12 readable sector families.
// Used for display/filtering. Distinct from the coarser industrie/BTP/commerce-de-gros
// bucket used internally by the scoring rubric (see scoring.ts) — that bucket optimizes
// for the score's four-criterion math, this one optimizes for a human scanning the table.

export const NAF_FAMILIES = [
  "Industrie",
  "Agroalimentaire",
  "BTP",
  "Négoce auto",
  "Commerce de gros",
  "Commerce de détail",
  "Transport & logistique",
  "CHR",
  "Services B2B",
  "Immobilier",
  "Santé",
  "Autres",
] as const;

export type NafFamily = (typeof NAF_FAMILIES)[number];

export function nafFamily(nafCode: string | null): NafFamily {
  if (!nafCode) return "Autres";
  const division = Number(nafCode.slice(0, 2));
  if (Number.isNaN(division)) return "Autres";

  if (division >= 10 && division <= 12) return "Agroalimentaire";
  if (division >= 5 && division <= 9) return "Industrie";
  if (division >= 13 && division <= 33) return "Industrie";
  if (division >= 35 && division <= 39) return "Industrie";
  if (division >= 41 && division <= 43) return "BTP";
  if (division === 45) return "Négoce auto";
  if (division === 46) return "Commerce de gros";
  if (division === 47) return "Commerce de détail";
  if (division >= 49 && division <= 53) return "Transport & logistique";
  if (division >= 55 && division <= 56) return "CHR";
  if (division >= 58 && division <= 66) return "Services B2B";
  if (division === 68) return "Immobilier";
  if (division >= 69 && division <= 82) return "Services B2B";
  if (division >= 86 && division <= 88) return "Santé";
  return "Autres";
}
