import { Sparkline } from "./Sparkline";

export function KpiCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: number }[];
}) {
  return (
    <div
      className="rounded-[24px] bg-canvas p-6"
      style={{ boxShadow: "0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-tertiary">{label}</p>
          <p className="tabular mt-3 text-xl font-medium text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {trend && trend.length > 1 && <Sparkline data={trend} />}
      </div>
    </div>
  );
}
