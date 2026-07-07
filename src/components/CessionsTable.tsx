"use client";

import { useMemo, useState } from "react";
import type { CessionRow } from "@/lib/data";
import { effectifsLabel, formatDate, scoreBand } from "@/lib/format";

const PAGE_SIZE = 25;

const scoreBandStyles: Record<string, string> = {
  high: "bg-accent text-white",
  medium: "bg-ink/10 text-ink",
  low: "bg-ink/5 text-muted",
  none: "bg-ink/5 text-tertiary",
};

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

export function CessionsTable({
  rows,
  regions,
  secteurs,
}: {
  rows: CessionRow[];
  regions: string[];
  secteurs: string[];
}) {
  const [region, setRegion] = useState("");
  const [secteur, setSecteur] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (region && r.region_nom !== region) return false;
      if (secteur && r.naf_label !== secteur) return false;
      if (minScore > 0 && (r.score ?? -1) < minScore) return false;
      if (search && !r.denomination?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, region, secteur, minScore, search]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
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
          placeholder="Rechercher une entreprise..."
          value={search}
          onChange={(e) => resetPage(setSearch)(e.target.value)}
          className={`min-w-[220px] flex-1 ${fieldClasses}`}
        />
        <select value={region} onChange={(e) => resetPage(setRegion)(e.target.value)} className={fieldClasses}>
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={secteur} onChange={(e) => resetPage(setSecteur)(e.target.value)} className={fieldClasses}>
          <option value="">Tous secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={minScore}
          onChange={(e) => resetPage(setMinScore)(Number(e.target.value))}
          className={fieldClasses}
        >
          <option value={0}>Tous scores</option>
          <option value={70}>Score ≥ 70</option>
          <option value={45}>Score ≥ 45</option>
        </select>
        <button
          onClick={() => downloadCsv(filtered)}
          className="transition-filters ml-auto rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:opacity-85"
        >
          Export CSV ({filtered.length})
        </button>
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
                  {r.url_bodacc ? (
                    <a href={r.url_bodacc} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {r.denomination ?? "—"}
                    </a>
                  ) : (
                    r.denomination ?? "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{r.ville ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{r.region_nom ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{r.naf_label ?? "—"}</td>
                <td className="tabular whitespace-nowrap px-4 py-3 text-muted">{effectifsLabel(r.effectifs)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`tabular rounded-full px-2.5 py-1 text-xs font-medium ${scoreBandStyles[scoreBand(r.score)]}`}
                  >
                    {r.score ?? "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-tertiary">Aucune cession ne correspond aux filtres.</p>
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
