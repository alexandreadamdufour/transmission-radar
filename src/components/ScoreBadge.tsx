import type { ScoreDetails } from "@/lib/data";
import { scoreBand } from "@/lib/format";

const badgeStyles: Record<string, string> = {
  high: "bg-accent text-white",
  medium: "border border-accent text-accent bg-transparent",
  low: "bg-ink/5 text-muted",
  none: "bg-ink/5 text-tertiary",
};

export const SCORE_CRITERIA: { key: keyof ScoreDetails; label: string; max: number }[] = [
  { key: "effectifs_points", label: "Taille", max: 35 },
  { key: "age_points", label: "Ancienneté", max: 25 },
  { key: "secteur_points", label: "Secteur", max: 25 },
  { key: "region_points", label: "Région", max: 15 },
];

export function ScoreBadge({ score, details }: { score: number | null; details: ScoreDetails | null }) {
  const band = scoreBand(score);

  return (
    <span className="group relative inline-block">
      <span className={`tabular inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[band]}`}>
        {score ?? "—"}
      </span>
      {details && (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl bg-ink p-4 text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
          <span className="block text-xs font-medium uppercase tracking-wide text-white/50">
            Décomposition du score
          </span>
          <span className="mt-2 flex flex-col gap-1.5">
            {SCORE_CRITERIA.map((c) => (
              <span key={c.key} className="flex items-center justify-between text-xs">
                <span className="text-white/80">{c.label}</span>
                <span className="tabular font-medium">
                  {details[c.key]} / {c.max}
                </span>
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
