import { supabasePublic, type Cession } from "./supabase";

export type ScoreDetails = {
  effectifs_points: number;
  age_points: number;
  age_annees: number | null;
  secteur_points: number;
  secteur: string;
  region_points: number;
};

export type CessionRow = {
  id: string;
  date_parution: string;
  denomination: string | null;
  ville: string | null;
  departement: string | null;
  departement_nom: string | null;
  region_nom: string | null;
  naf_code: string | null;
  naf_label: string | null;
  effectifs: string | null;
  score: number | null;
  score_details: ScoreDetails | null;
  url_bodacc: string | null;
};

const ROW_LIMIT = 5000;
const LIST_COLUMNS =
  "id, date_parution, denomination, ville, departement, departement_nom, region_nom, naf_code, naf_label, effectifs, score, score_details, url_bodacc";

export async function getCessions(): Promise<CessionRow[]> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("cessions")
    .select(LIST_COLUMNS)
    .order("date_parution", { ascending: false })
    .limit(ROW_LIMIT);

  if (error) throw new Error(`Failed to load cessions: ${error.message}`);
  return (data as unknown as CessionRow[]) ?? [];
}

export async function getCessionById(id: string): Promise<Cession | null> {
  const supabase = supabasePublic();
  const { data, error } = await supabase.from("cessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load cession ${id}: ${error.message}`);
  return data;
}

export async function getLastUpdatedAt(): Promise<string | null> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("cessions")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load last update: ${error.message}`);
  return data?.updated_at ?? null;
}
