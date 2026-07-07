// Opportunity score (0-100) for a cession, computed at ingestion/enrichment time.
// See /methodologie for the human-readable explanation of this rubric.

const IDF_REGION_CODE = "11"; // Île-de-France

const EFFECTIFS_POINTS: Record<string, number> = {
  "11": 25, // 10 à 19 salariés
  "12": 35, // 20 à 49 salariés
  "21": 30, // 50 à 99 salariés
  "22": 20, // 100 à 199 salariés
  "31": 10, // 200 à 249 salariés
};

function industrieOrBtpOrCommerceScore(nafCode: string | null): {
  points: number;
  secteur: string;
} {
  if (!nafCode) return { points: 5, secteur: "inconnu" };
  const section = nafCode.slice(0, 2);
  const industrieSections = ["05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "35", "36", "37", "38", "39"];
  if (industrieSections.includes(section)) return { points: 25, secteur: "industrie" };
  if (section === "41" || section === "42" || section === "43") return { points: 20, secteur: "BTP" };
  if (section === "46") return { points: 15, secteur: "commerce de gros" };
  return { points: 5, secteur: "autre" };
}

function ageScore(dateCreation: string | null): { points: number; ageAnnees: number | null } {
  if (!dateCreation) return { points: 0, ageAnnees: null };
  const created = new Date(dateCreation);
  if (Number.isNaN(created.getTime())) return { points: 0, ageAnnees: null };
  const ageAnnees = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageAnnees >= 15) return { points: 25, ageAnnees };
  if (ageAnnees >= 10) return { points: 15, ageAnnees };
  if (ageAnnees >= 5) return { points: 5, ageAnnees };
  return { points: 0, ageAnnees };
}

export type ScoreInput = {
  effectifs: string | null;
  nafCode: string | null;
  dateCreation: string | null;
  regionCode: string | null;
};

export type ScoreResult = {
  score: number;
  details: {
    effectifs_points: number;
    age_points: number;
    age_annees: number | null;
    secteur_points: number;
    secteur: string;
    region_points: number;
  };
};

export function computeScore(input: ScoreInput): ScoreResult {
  const effectifsPoints = input.effectifs ? EFFECTIFS_POINTS[input.effectifs] ?? 0 : 0;
  const { points: agePoints, ageAnnees } = ageScore(input.dateCreation);
  const { points: secteurPoints, secteur } = industrieOrBtpOrCommerceScore(input.nafCode);
  const regionPoints = input.regionCode && input.regionCode !== IDF_REGION_CODE ? 15 : 5;

  const score = effectifsPoints + agePoints + secteurPoints + regionPoints;

  return {
    score,
    details: {
      effectifs_points: effectifsPoints,
      age_points: agePoints,
      age_annees: ageAnnees === null ? null : Math.round(ageAnnees * 10) / 10,
      secteur_points: secteurPoints,
      secteur,
      region_points: regionPoints,
    },
  };
}
