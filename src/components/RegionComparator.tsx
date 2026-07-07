"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RegionStats } from "@/lib/regions";

export function RegionComparator({ regions }: { regions: RegionStats[] }) {
  const names = regions.map((r) => r.nom);
  const [a, setA] = useState(names[0] ?? "");
  const [b, setB] = useState(names[1] ?? names[0] ?? "");

  const statsA = regions.find((r) => r.nom === a);
  const statsB = regions.find((r) => r.nom === b);

  const sectorRows = useMemo(() => {
    if (!statsA || !statsB) return [];
    const sectors = new Set([...Object.keys(statsA.sectorCounts), ...Object.keys(statsB.sectorCounts)]);
    return [...sectors]
      .map((label) => ({
        label,
        a: statsA.sectorCounts[label] ?? 0,
        b: statsB.sectorCounts[label] ?? 0,
      }))
      .sort((x, y) => y.a + y.b - (x.a + x.b))
      .slice(0, 6);
  }, [statsA, statsB]);

  const fieldClasses =
    "transition-filters rounded-full border border-ink/15 bg-canvas px-4 py-2 text-sm text-ink focus:outline-none focus:border-ink/40";

  return (
    <div className="rounded-[24px] bg-nested p-6">
      <h3 className="text-sm font-medium text-tertiary">Comparateur de régions</h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={a} onChange={(e) => setA(e.target.value)} className={fieldClasses}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-xs text-tertiary">vs</span>
        <select value={b} onChange={(e) => setB(e.target.value)} className={fieldClasses}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {statsA && statsB && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-tertiary">{statsA.nom}</p>
              <p className="tabular mt-1 text-2xl font-medium text-ink">{statsA.count} cessions</p>
              <p className="tabular text-sm text-muted">score moyen {statsA.avgScore ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-tertiary">{statsB.nom}</p>
              <p className="tabular mt-1 text-2xl font-medium text-ink">{statsB.count} cessions</p>
              <p className="tabular text-sm text-muted">score moyen {statsB.avgScore ?? "—"}</p>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorRows} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#777b86" }}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e4e4e6", boxShadow: "none" }}
                  labelStyle={{ fontWeight: 500, color: "#17191c" }}
                />
                <Bar dataKey="a" name={statsA.nom} fill="#1f4d3f" radius={[0, 4, 4, 0]} maxBarSize={12} />
                <Bar dataKey="b" name={statsB.nom} fill="#1f4d3f" fillOpacity={0.3} radius={[0, 4, 4, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
