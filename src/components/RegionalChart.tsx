"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function RegionalChart({ data }: { data: { region: string; count: number }[] }) {
  return (
    <div className="rounded-[24px] bg-nested p-6">
      <h3 className="text-sm font-medium text-tertiary">Répartition régionale</h3>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            barCategoryGap={10}
            margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="region"
              tick={{ fontSize: 11, fill: "#777b86" }}
              axisLine={false}
              tickLine={false}
              width={132}
            />
            <Tooltip
              cursor={{ fill: "rgba(31,77,63,0.06)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #e4e4e6",
                boxShadow: "none",
              }}
              labelStyle={{ fontWeight: 500, color: "#17191c" }}
            />
            <Bar dataKey="count" name="Cessions" fill="#1f4d3f" radius={[0, 4, 4, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
