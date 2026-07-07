const SIRENE_BASE = "https://recherche-entreprises.api.gouv.fr/search";

export type SireneEnrichment = {
  naf_code: string | null;
  effectifs: string | null;
  date_creation_entreprise: string | null;
};

export async function enrichBySiren(siren: string): Promise<SireneEnrichment | null> {
  const url = new URL(SIRENE_BASE);
  url.searchParams.set("q", siren);
  url.searchParams.set("per_page", "1");

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`SIRENE API error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    results: Array<{
      siren: string;
      activite_principale: string | null;
      tranche_effectif_salarie: string | null;
      date_creation: string | null;
    }>;
  };

  const match = json.results.find((r) => r.siren === siren);
  if (!match) return null;

  return {
    naf_code: match.activite_principale,
    effectifs: match.tranche_effectif_salarie,
    date_creation_entreprise: match.date_creation,
  };
}

// Simple fixed-rate throttle: at most `ratePerSecond` calls start per second.
export function createThrottle(ratePerSecond: number) {
  const intervalMs = 1000 / ratePerSecond;
  let lastCallAt = 0;

  return async function throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, lastCallAt + intervalMs - now);
    lastCallAt = now + wait;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return fn();
  };
}
