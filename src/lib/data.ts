import { supabasePublic } from "./supabase";

export type CessionRow = {
  id: string;
  date_parution: string;
  denomination: string | null;
  ville: string | null;
  departement_nom: string | null;
  region_nom: string | null;
  naf_code: string | null;
  naf_label: string | null;
  effectifs: string | null;
  score: number | null;
  url_bodacc: string | null;
};

const ROW_LIMIT = 5000;

export async function getCessions(): Promise<CessionRow[]> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("cessions")
    .select(
      "id, date_parution, denomination, ville, departement_nom, region_nom, naf_code, naf_label, effectifs, score, url_bodacc"
    )
    .order("date_parution", { ascending: false })
    .limit(ROW_LIMIT);

  if (error) throw new Error(`Failed to load cessions: ${error.message}`);
  return data ?? [];
}
