const BODACC_BASE = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records";
const PAGE_SIZE = 100;

export type BodaccRecord = {
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
};

type RawRecord = {
  id: string;
  dateparution: string;
  registre?: string[] | null;
  commercant?: string | null;
  tribunal?: string | null;
  ville?: string | null;
  cp?: string | null;
  numerodepartement?: string | null;
  departement_nom_officiel?: string | null;
  region_code?: number | null;
  region_nom_officiel?: string | null;
  url_complete?: string | null;
  listeetablissements?: string | null;
  acte?: string | null;
};

function extractSiren(registre: string[] | null | undefined): string | null {
  if (!registre) return null;
  const digitsOnly = registre.find((r) => /^\d{9}$/.test(r.replace(/\s/g, "")));
  return digitsOnly ? digitsOnly.replace(/\s/g, "") : null;
}

function safeParse(json: string | null | undefined): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractActivite(listeetablissements: string | null | undefined): string | null {
  const parsed = safeParse(listeetablissements) as { etablissement?: { activite?: string } } | null;
  return parsed?.etablissement?.activite ?? null;
}

function extractCategorieVente(acte: string | null | undefined): string | null {
  const parsed = safeParse(acte) as { vente?: { categorieVente?: string } } | null;
  return parsed?.vente?.categorieVente ?? null;
}

function toCession(raw: RawRecord): BodaccRecord {
  return {
    bodacc_id: raw.id,
    date_parution: raw.dateparution,
    siren: extractSiren(raw.registre),
    denomination: raw.commercant ?? null,
    activite: extractActivite(raw.listeetablissements),
    categorie_vente: extractCategorieVente(raw.acte),
    tribunal: raw.tribunal ?? null,
    ville: raw.ville ?? null,
    code_postal: raw.cp ?? null,
    departement: raw.numerodepartement ?? null,
    departement_nom: raw.departement_nom_officiel ?? null,
    region_code: raw.region_code != null ? String(raw.region_code) : null,
    region_nom: raw.region_nom_officiel ?? null,
    url_bodacc: raw.url_complete ?? null,
  };
}

async function countFor(where: string): Promise<number> {
  const url = new URL(BODACC_BASE);
  url.searchParams.set("where", where);
  url.searchParams.set("limit", "1");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`BODACC API error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { total_count: number };
  return json.total_count;
}

async function* fetchRange(sinceDate: string, untilDate: string): AsyncGenerator<BodaccRecord[]> {
  const where = `familleavis_lib="Ventes et cessions" and dateparution>="${sinceDate}" and dateparution<"${untilDate}"`;
  const total = await countFor(where);

  // Opendatasoft caps offset+limit at 10000; split the window in two if we'd exceed it.
  if (total > 9900) {
    const sinceMs = new Date(sinceDate).getTime();
    const untilMs = new Date(untilDate).getTime();
    const midMs = sinceMs + Math.floor((untilMs - sinceMs) / 2);
    const mid = new Date(midMs).toISOString().slice(0, 10);
    if (mid === sinceDate || mid === untilDate) {
      // Range can't be split further (single day with >10000 records) — take what we can.
    } else {
      yield* fetchRange(sinceDate, mid);
      yield* fetchRange(mid, untilDate);
      return;
    }
  }

  let offset = 0;
  while (true) {
    const url = new URL(BODACC_BASE);
    url.searchParams.set("where", where);
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("order_by", "dateparution asc");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`BODACC API error ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { results: RawRecord[]; total_count: number };
    if (json.results.length === 0) break;

    yield json.results.map(toCession);

    offset += PAGE_SIZE;
    if (offset >= json.total_count || offset >= 9900) break;
  }
}

// Fetches all "Ventes et cessions" BODACC records published on/after `sinceDate` (YYYY-MM-DD),
// optionally up to (exclusive) `untilDate`. Handles Opendatasoft's 10k offset+limit cap by
// recursively splitting the date window.
export async function* fetchVentesEtCessions(sinceDate: string, untilDate?: string): AsyncGenerator<BodaccRecord[]> {
  const until = untilDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  yield* fetchRange(sinceDate, until);
}
