"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RegionalChart({ data }: { data: { region: string; count: number }[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Répartition régionale
      </h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 24, right: 16, top: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-zinc-100 dark:stroke-zinc-800" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="currentColor" className="text-zinc-500" allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-zinc-500"
              width={140}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelStyle={{ fontWeight: 600 }} />
            <Bar dataKey="count" name="Cessions" fill="#0891b2" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
