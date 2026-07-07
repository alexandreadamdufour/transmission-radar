"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Feature = {
  type: "Feature";
  properties: { code: string; nom: string };
  geometry: GeoJSON.Geometry;
};

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

function centroidLat(geometry: GeoJSON.Geometry): number {
  const coords: number[][] = [];
  const collect = (arr: unknown): void => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === "number") {
      coords.push(arr as number[]);
      return;
    }
    for (const item of arr) collect(item);
  };
  collect((geometry as unknown as { coordinates: unknown }).coordinates);
  if (coords.length === 0) return 0;
  return coords.reduce((s, c) => s + c[1], 0) / coords.length;
}

export function FranceMap({ stats }: { stats: DeptStats[] }) {
  const [metric, setMetric] = useState<Metric>("volume");
  const [features, setFeatures] = useState<Feature[] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const statsByCode = useMemo(() => new Map(stats.map((s) => [s.code, s])), [stats]);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/departements-topo.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const objectName = Object.keys(topo.objects)[0];
        const collection = feature(topo, topo.objects[objectName]) as unknown as { features: Feature[] };
        setFeatures(collection.features);
      })
      .catch(() => setFeatures([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!features) return;
    const already = typeof window !== "undefined" && sessionStorage.getItem("radar:map-animated");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (already || reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time animation bailout (already played / reduced motion)
      setAnimated(true);
      return;
    }
    sessionStorage.setItem("radar:map-animated", "1");
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [features]);

  const metroFeatures = useMemo(() => (features ?? []).filter((f) => !isDomTom(f.properties.code)), [features]);
  const domtomFeatures = useMemo(() => (features ?? []).filter((f) => isDomTom(f.properties.code)), [features]);

  const orderedMetro = useMemo(
    () => [...metroFeatures].sort((a, b) => centroidLat(b.geometry) - centroidLat(a.geometry)),
    [metroFeatures]
  );

  const colorFor = useMemo(() => {
    const values = [...statsByCode.values()].map((s) => metricValue(s, metric));
    return buildColorScale(values);
  }, [statsByCode, metric]);

  const { pathFor, width, height } = useMemo(() => {
    const w = 600;
    const h = 560;
    if (metroFeatures.length === 0) return { pathFor: null, width: w, height: h };
    const projection = geoConicConformal()
      .parallels([44, 49])
      .rotate([-3, 0]);
    const collection = { type: "FeatureCollection" as const, features: metroFeatures as never[] };
    projection.fitSize([w, h], collection as never);
    const gen = geoPath(projection);
    return { pathFor: gen, width: w, height: h };
  }, [metroFeatures]);

  function showTooltip(code: string, e: React.MouseEvent | React.TouchEvent) {
    setHovered(code);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = "touches" in e ? e.touches[0] : e;
    setPointer({ x: point.clientX - rect.left, y: point.clientY - rect.top });
  }

  function selectDepartement(code: string, nom: string) {
    window.dispatchEvent(new CustomEvent("radar:filter-departement", { detail: { code, nom } }));
    document.getElementById("annonces")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hoveredStats = hovered ? statsByCode.get(hovered) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Cliquez un département pour filtrer les annonces ci-dessous.</p>
        <div className="flex gap-1 rounded-full bg-ink/5 p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`transition-filters rounded-full px-3 py-1.5 text-xs font-medium ${
                metric === m.key ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative mt-6">
        {!features ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-tertiary">Chargement de la carte…</div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Carte des cessions par département">
            {pathFor &&
              orderedMetro.map((f, i) => {
                const s = statsByCode.get(f.properties.code);
                const d = pathFor(f as never) ?? undefined;
                return (
                  <path
                    key={f.properties.code}
                    d={d}
                    fill={colorFor(metricValue(s, metric))}
                    stroke="#ffffff"
                    strokeWidth={0.75}
                    className="cursor-pointer transition-filters hover:opacity-80"
                    style={
                      animated
                        ? undefined
                        : { opacity: 0, animation: `radar-dept-in 400ms ease-out ${i * 3}ms forwards` }
                    }
                    onMouseEnter={(e) => showTooltip(f.properties.code, e)}
                    onMouseMove={(e) => showTooltip(f.properties.code, e)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(e) => {
                      showTooltip(f.properties.code, e);
                      selectDepartement(f.properties.code, f.properties.nom);
                    }}
                  />
                );
              })}
          </svg>
        )}

        {hovered && hoveredStats && pointer && (
          <div
            className="tabular pointer-events-none absolute z-10 w-52 -translate-x-1/2 rounded-2xl bg-ink p-3 text-xs text-white shadow-xl"
            style={{ left: Math.min(Math.max(pointer.x, 100), width - 100), top: Math.max(pointer.y - 96, 0) }}
          >
            <p className="font-medium">{hoveredStats.nom}</p>
            <p className="mt-1 text-white/70">{hoveredStats.count} cession{hoveredStats.count > 1 ? "s" : ""}</p>
            <p className="text-white/70">Score moyen : {hoveredStats.avgScore ?? "—"}</p>
            <p className="text-white/70">Secteur dominant : {hoveredStats.topSecteur ?? "—"}</p>
          </div>
        )}
      </div>

      {domtomFeatures.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-4">
          {domtomFeatures.map((f) => {
            const s = statsByCode.get(f.properties.code);
            const projection = geoConicConformal().fitSize(
              [72, 72],
              { type: "FeatureCollection", features: [f] } as never
            );
            const gen = geoPath(projection);
            return (
              <div key={f.properties.code} className="text-center">
                <svg
                  viewBox="0 0 72 72"
                  width={72}
                  height={72}
                  className="cursor-pointer"
                  onMouseEnter={(e) => showTooltip(f.properties.code, e)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={(e) => {
                    showTooltip(f.properties.code, e);
                    selectDepartement(f.properties.code, f.properties.nom);
                  }}
                >
                  <path d={gen(f as never) ?? undefined} fill={colorFor(metricValue(s, metric))} stroke="#ffffff" strokeWidth={1} />
                </svg>
                <p className="mt-1 text-xs text-tertiary">{f.properties.nom}</p>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes radar-dept-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
