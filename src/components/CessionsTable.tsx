"use client";

import { useMemo, useState } from "react";
import type { CessionRow } from "@/lib/data";
import { effectifsLabel, formatDate, scoreBand } from "@/lib/format";

const PAGE_SIZE = 25;

const scoreBandStyles: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  none: "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
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

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          value={search}
          onChange={(e) => resetPage(setSearch)(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700"
        />
        <select
          value={region}
          onChange={(e) => resetPage(setRegion)(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          <option value="">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={secteur}
          onChange={(e) => resetPage(setSecteur)(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
        >
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
          className="rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          <option value={0}>Tous scores</option>
          <option value={70}>Score ≥ 70</option>
          <option value={45}>Score ≥ 45</option>
        </select>
        <button
          onClick={() => downloadCsv(filtered)}
          className="ml-auto rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-zinc-400">
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
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{formatDate(r.date_parution)}</td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {r.url_bodacc ? (
                    <a href={r.url_bodacc} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {r.denomination ?? "—"}
                    </a>
                  ) : (
                    r.denomination ?? "—"
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{r.ville ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{r.region_nom ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{r.naf_label ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{effectifsLabel(r.effectifs)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreBandStyles[scoreBand(r.score)]}`}>
                    {r.score ?? "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-zinc-400">Aucune cession ne correspond aux filtres.</p>
        )}
      </div>

      {paginated.length < filtered.length && (
        <div className="border-t border-zinc-200 p-4 text-center dark:border-zinc-800">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Afficher plus ({filtered.length - paginated.length} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
