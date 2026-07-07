"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export function MonthlyVolumeChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <div className="rounded-[24px] bg-nested p-6">
      <h3 className="text-sm font-medium text-tertiary">Volume mensuel des cessions</h3>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#979799" }}
              axisLine={{ stroke: "#e4e4e6" }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: "#e4e4e6" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #e4e4e6",
                boxShadow: "none",
              }}
              labelStyle={{ fontWeight: 500, color: "#17191c" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              name="Cessions"
              stroke="#1f4d3f"
              strokeWidth={2}
              dot={{ r: 3, fill: "#1f4d3f", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
