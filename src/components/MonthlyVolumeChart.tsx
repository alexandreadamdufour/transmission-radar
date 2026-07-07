"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlyVolumeChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Volume mensuel des cessions
      </h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-500" />
            <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-500" allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" name="Cessions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
