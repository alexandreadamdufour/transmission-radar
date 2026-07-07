import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabasePublic() {
  return createClient(url, anonKey);
}

export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export type Cession = {
  id: string;
  bodacc_id: string;
  date_parution: string;
  siren: string | null;
  denomination: string | null;
  activite: string | null;
  categorie_vente: string | null;
  tribunal: string | null;
  ville: string | null;
  code_postal: string | null;
  departement: string | null;
  departement_nom: string | null;
  region_code: string | null;
  region_nom: string | null;
  url_bodacc: string | null;
  naf_code: string | null;
  naf_label: string | null;
  effectifs: string | null;
  date_creation_entreprise: string | null;
  enriched: boolean;
  enrichment_error: string | null;
  score: number | null;
  score_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};
