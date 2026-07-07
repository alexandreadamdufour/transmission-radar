import type { ScoreDetails } from "@/lib/data";
import { SCORE_CRITERIA } from "./ScoreBadge";

export function ScoreBreakdown({ details }: { details: ScoreDetails }) {
  return (
    <div className="flex flex-col gap-4">
      {SCORE_CRITERIA.map((c) => {
        const value = details[c.key] as number;
        const pct = Math.round((value / c.max) * 100);
        return (
          <div key={c.key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink">{c.label}</span>
              <span className="tabular text-muted">
                {value} / {c.max}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/8">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
