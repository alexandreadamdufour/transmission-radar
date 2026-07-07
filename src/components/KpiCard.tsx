"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkline } from "./Sparkline";

const DURATION_MS = 800;

function useCountUp(target: number | undefined) {
  const [display, setDisplay] = useState<number | null>(target ?? null);
  const started = useRef(false);

  useEffect(() => {
    if (target == null) return;
    if (started.current) return;
    started.current = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // initial state already equals target

    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return display;
}

export function KpiCard({
  label,
  value,
  animateTo,
  hint,
  trend,
}: {
  label: string;
  value: string;
  animateTo?: number;
  hint?: string;
  trend?: { value: number }[];
}) {
  const animated = useCountUp(animateTo);
  const display = animateTo != null && animated != null ? animated.toLocaleString("fr-FR") : value;

  return (
    <div
      className="rounded-[24px] bg-canvas p-6"
      style={{ boxShadow: "0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-tertiary">{label}</p>
          <p className="tabular mt-3 text-xl font-medium text-ink">{display}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {trend && trend.length > 1 && <Sparkline data={trend} />}
      </div>
    </div>
  );
}
