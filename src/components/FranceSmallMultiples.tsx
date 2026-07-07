"use client";

import { useEffect, useMemo, useState } from "react";
import { geoConicConformal, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { DeptStats } from "@/lib/departements";
import { isDomTom } from "@/lib/departements";

type Metric = "volume" | "score" | "opportunites";
const METRICS: { key: Metric; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "score", label: "Score moyen" },
  { key: "opportunites", label: "Opportunités ≥ 70" },
];
const GREEN_SCALE = ["#f2f2f3", "#c8d8d1", "#9dbcac", "#5c8b74", "#1f4d3f"];

type Feature = { type: "Feature"; properties: { code: string; nom: string }; geometry: GeoJSON.Geometry };

function metricValue(stats: DeptStats | undefined, metric: Metric): number {
  if (!stats) return 0;
  if (metric === "volume") return stats.count;
  if (metric === "score") return stats.avgScore ?? 0;
  return stats.strongCount;
}

function buildColorScale(values: number[]) {
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (positive.length === 0) return () => GREEN_SCALE[0];
  const breaks = [0.2, 0.4, 0.6, 0.8].map((p) => positive[Math.min(positive.length - 1, Math.floor(p * positive.length))]);
  return (v: number) => {
    if (v <= 0) return GREEN_SCALE[0];
    let i = 0;
    while (i < breaks.length && v > breaks[i]) i++;
    return GREEN_SCALE[Math.min(i, GREEN_SCALE.length - 1)];
  };
}

export function FranceSmallMultiples({ stats }: { stats: DeptStats[] }) {
  const [features, setFeatures] = useState<Feature[] | null>(null);
  const statsByCode = useMemo(() => new Map(stats.map((s) => [s.code, s])), [stats]);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/departements-topo.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const objectName = Object.keys(topo.objects)[0];
        const collection = feature(topo, topo.objects[objectName]) as unknown as { features: Feature[] };
        setFeatures(collection.features.filter((f) => !isDomTom(f.properties.code)));
      })
      .catch(() => setFeatures([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const { pathFor, width, height } = useMemo(() => {
    const w = 280;
    const h = 260;
    if (!features || features.length === 0) return { pathFor: null, width: w, height: h };
    const projection = geoConicConformal().parallels([44, 49]).rotate([-3, 0]);
    projection.fitSize([w, h], { type: "FeatureCollection", features } as never);
    return { pathFor: geoPath(projection), width: w, height: h };
  }, [features]);

  if (!features) {
    return <div className="flex h-64 items-center justify-center text-sm text-tertiary">Chargement…</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {METRICS.map((m) => {
        const values = [...statsByCode.values()].map((s) => metricValue(s, m.key));
        const colorFor = buildColorScale(values);
        return (
          <div key={m.key}>
            <p className="text-center text-xs font-medium text-tertiary">{m.label}</p>
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full">
              {pathFor &&
                features.map((f) => (
                  <path
                    key={f.properties.code}
                    d={pathFor(f as never) ?? undefined}
                    fill={colorFor(metricValue(statsByCode.get(f.properties.code), m.key))}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                  />
                ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
