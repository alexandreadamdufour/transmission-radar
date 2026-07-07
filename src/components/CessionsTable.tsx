"use client";

import { useEffect, useMemo, useState } from "react";
import type { CessionRow } from "@/lib/data";
import { effectifsLabel, effectifsTooltip, formatDate, hasQualifyingHeadcount } from "@/lib/format";
import { ScoreBadge } from "./ScoreBadge";

const PAGE_SIZE = 25;
const QUALIFIED_MIN_SCORE = 40;

function toCsv(rows: CessionRow[]): string {
  const header = ["date", "entreprise", "ville", "departement", "region", "secteur", "effectifs", "score", "url_bodacc"];
  const lines = rows.map((r) =>
    [
      r.date_parution,
      r.denomination ?? "",
      r.ville ?? "",
      r.departement_nom ?? "",
      r.region_nom ?? "",
      r.naf_label ?? "",
      effectifsLabel(r.effectifs),
      r.score ?? "",
      r.url_bodacc ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(rows: CessionRow[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transmission-radar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function isQualifiedPme(r: CessionRow): boolean {
  return (r.score ?? -1) >= QUALIFIED_MIN_SCORE || hasQualifyingHeadcount(r.effectifs);
}

function isRecent(dateParution: string): boolean {
  const hours = (Date.now() - new Date(dateParution).getTime()) / 3_600_000;
  return hours >= 0 && hours < 48;
}

function readParams() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

function writeParams(params: Record<string, string>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, "", url.toString());
}

export function CessionsTable({
  rows,
  regions,
  secteurs,
}: {
  rows: CessionRow[];
  regions: string[];
  secteurs: string[];
}) {
  const [filters, setFilters] = useState({ region: "", secteur: "", minScore: 0, search: "", includeAll: false });
  const { region, secteur, minScore, search, includeAll } = filters;
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // Hydrate filter state from the URL once, on mount (shareable links). A single
  // setState call here (not one per field) keeps this an external-system sync,
  // not a cascading-render pattern.
  useEffect(() => {
    const params = readParams();
    if (!params) return;
    const q = params.get("q") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL on mount
    setSearchInput(q);
    setFilters({
      region: params.get("region") ?? "",
      secteur: params.get("secteur") ?? "",
      minScore: Number(params.get("score") ?? 0),
      search: q,
      includeAll: params.get("all") === "1",
    });
  }, []);

  // Debounce the free-text search before it hits the filter + URL.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Subscribe to department selection from the France map (search already matches departement_nom).
  useEffect(() => {
    function onDeptSelect(e: Event) {
      const nom = (e as CustomEvent<{ nom: string }>).detail?.nom;
      if (!nom) return;
      setSearchInput(nom);
      setFilters((f) => ({ ...f, search: nom }));
      setPage(1);
    }
    window.addEventListener("radar:filter-departement", onDeptSelect);
    return () => window.removeEventListener("radar:filter-departement", onDeptSelect);
  }, []);

  useEffect(() => {
    writeParams({ region, secteur, score: minScore ? String(minScore) : "", q: search, all: includeAll ? "1" : "" });
  }, [region, secteur, minScore, search, includeAll]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!includeAll && !isQualifiedPme(r)) return false;
      if (region && r.region_nom !== region) return false;
      if (secteur && r.naf_label !== secteur) return false;
      if (minScore > 0 && (r.score ?? -1) < minScore) return false;
      if (
        term &&
        !r.denomination?.toLowerCase().includes(term) &&
        !r.ville?.toLowerCase().includes(term) &&
        !r.departement_nom?.toLowerCase().includes(term)
      )
        return false;
      return true;
    });
  }, [rows, region, secteur, minScore, search, includeAll]);

  const excludedCount = rows.length - rows.filter(isQualifiedPme).length;
  const paginated = filtered.slice(0, page * PAGE_SIZE);

  function updateFilter<K extends keyof typeof filters>(key: K) {
    return (value: (typeof filters)[K]) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setPage(1);
    };
  }

  const fieldClasses =
    "transition-filters rounded-full border border-ink/15 bg-canvas px-4 py-2 text-sm text-ink placeholder:text-tertiary focus:outline-none focus:border-ink/40";

  return (
    <div className="rounded-[24px] bg-nested">
      <div className="flex flex-wrap items-center gap-3 p-6">
        <input
          type="text"
          placeholder="Entreprise, ville, département..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          className={`min-w-[220px] flex-1 ${fieldClasses}`}
        />
        <select value={region} onChange={(e) => updateFilter("region")(e.target.value)} className={fieldClasses}>
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={secteur} onChange={(e) => updateFilter("secteur")(e.target.value)} className={fieldClasses}>
          <option value="">Tous secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={minScore}
          onChange={(e) => updateFilter("minScore")(Number(e.target.value))}
          className={fieldClasses}
        >
          <option value={0}>Tous scores</option>
          <option value={70}>Score ≥ 70</option>
          <option value={40}>Score ≥ 40</option>
        </select>
        <button
          onClick={() => downloadCsv(filtered)}
          className="transition-filters ml-auto rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:opacity-85"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="flex items-center gap-2 px-6 pb-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={includeAll}
            onChange={(e) => updateFilter("includeAll")(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#1f4d3f]"
          />
          Inclure les fonds de commerce
          {!includeAll && excludedCount > 0 && (
            <span className="text-tertiary">({excludedCount.toLocaleString("fr-FR")} masqués)</span>
          )}
        </label>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-tertiary">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Entreprise</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Région</th>
              <th className="px-4 py-3 font-medium">Secteur</th>
              <th className="px-4 py-3 font-medium">Effectifs</th>
              <th className="px-4 py-3 font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => (
              <tr key={r.id} className="rounded-2xl bg-canvas [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl">
                <td className="tabular whitespace-nowrap px-4 py-3 text-muted">{formatDate(r.date_parution)}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <a href={`/annonce/${r.id}`} className="inline-flex items-center gap-2 hover:underline">
                    {isRecent(r.date_parution) && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" title="Nouveau (moins de 48h)" />
                    )}
                    {r.denomination ?? "—"}
                  </a>
                </td>
                <td className="px-4 py-3 text-muted">{r.ville ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{r.region_nom ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{r.naf_label ?? "—"}</td>
                <td className="tabular whitespace-nowrap px-4 py-3 text-muted" title={effectifsTooltip(r.effectifs)}>
                  {effectifsLabel(r.effectifs)}
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={r.score} details={r.score_details} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <p className="font-serif-display text-3xl text-ink/20">∅</p>
            <p className="text-sm text-muted">Aucune cession ne correspond à ces filtres.</p>
            <button
              onClick={() => {
                setFilters({ region: "", secteur: "", minScore: 0, search: "", includeAll });
                setSearchInput("");
                setPage(1);
              }}
              className="transition-filters mt-1 rounded-full border border-ink/20 px-4 py-1.5 text-xs font-medium text-ink hover:bg-ink hover:text-white"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {paginated.length < filtered.length && (
        <div className="p-6 pt-2 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="transition-filters rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            Afficher plus ({filtered.length - paginated.length} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
