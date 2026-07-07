import { fetchVentesEtCessions, type BodaccRecord } from "./bodacc";
import { enrichBySiren, createThrottle } from "./sirene";
import { computeScore } from "./scoring";
import { supabaseAdmin } from "./supabase";

export type IngestResult = {
  fetched: number;
  enriched: number;
  enrichmentFailed: number;
  upserted: number;
};

const SIRENE_RATE_PER_SECOND = 5;
const UPSERT_BATCH_SIZE = 200;

export async function runIngestion(sinceDate: string, untilDate?: string, onProgress?: (r: IngestResult) => void): Promise<IngestResult> {
  const supabase = supabaseAdmin();
  const throttle = createThrottle(SIRENE_RATE_PER_SECOND);

  const result: IngestResult = { fetched: 0, enriched: 0, enrichmentFailed: 0, upserted: 0 };
  let batch: Record<string, unknown>[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    const { error } = await supabase.from("cessions").upsert(batch, { onConflict: "bodacc_id" });
    if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
    result.upserted += batch.length;
    batch = [];
    onProgress?.(result);
  };

  for await (const page of fetchVentesEtCessions(sinceDate, untilDate)) {
    result.fetched += page.length;

    const enrichedPage = await Promise.all(page.map((record) => enrichRecord(record, throttle)));

    for (const row of enrichedPage) {
      if (row.enriched) result.enriched += 1;
      else result.enrichmentFailed += 1;
      batch.push(row);
      if (batch.length >= UPSERT_BATCH_SIZE) await flush();
    }
  }

  await flush();
  return result;
}

async function enrichRecord(record: BodaccRecord, throttle: <T>(fn: () => Promise<T>) => Promise<T>) {
  let enrichment: Awaited<ReturnType<typeof enrichBySiren>> = null;
  let enrichmentError: string | null = null;

  if (record.siren) {
    try {
      enrichment = await throttle(() => enrichBySiren(record.siren!));
      if (!enrichment) enrichmentError = "SIREN not found in recherche-entreprises";
    } catch (err) {
      enrichmentError = err instanceof Error ? err.message : String(err);
    }
  } else {
    enrichmentError = "No SIREN extracted from BODACC record";
  }

  const scored = enrichment
    ? computeScore({
        effectifs: enrichment.effectifs,
        nafCode: enrichment.naf_code,
        dateCreation: enrichment.date_creation_entreprise,
        regionCode: record.region_code,
      })
    : null;

  return {
    bodacc_id: record.bodacc_id,
    date_parution: record.date_parution,
    siren: record.siren,
    denomination: record.denomination,
    activite: record.activite,
    categorie_vente: record.categorie_vente,
    tribunal: record.tribunal,
    ville: record.ville,
    code_postal: record.code_postal,
    departement: record.departement,
    departement_nom: record.departement_nom,
    region_code: record.region_code,
    region_nom: record.region_nom,
    url_bodacc: record.url_bodacc,
    naf_code: enrichment?.naf_code ?? null,
    naf_label: scored?.details.secteur ?? null,
    effectifs: enrichment?.effectifs ?? null,
    date_creation_entreprise: enrichment?.date_creation_entreprise ?? null,
    enriched: enrichment != null,
    enrichment_error: enrichmentError,
    score: scored?.score ?? null,
    score_details: scored?.details ?? null,
    updated_at: new Date().toISOString(),
  };
}
