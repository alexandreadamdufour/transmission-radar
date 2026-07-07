"use client";

import dynamic from "next/dynamic";
import type { DeptStats } from "@/lib/departements";

const FranceMap = dynamic(() => import("./FranceMap").then((m) => m.FranceMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center text-sm text-tertiary">Chargement de la carte…</div>
  ),
});

export function FranceMapLoader({ stats }: { stats: DeptStats[] }) {
  return <FranceMap stats={stats} />;
}
