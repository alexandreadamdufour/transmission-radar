"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AnalysisBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 32 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#777b86" }}
            axisLine={{ stroke: "#e4e4e6" }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(31,77,63,0.06)" }}
            contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e4e4e6", boxShadow: "none" }}
            labelStyle={{ fontWeight: 500, color: "#17191c" }}
          />
          <Bar dataKey="count" name="Cessions" fill="#1f4d3f" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
