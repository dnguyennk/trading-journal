"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CumulativePoint } from "@/lib/funds/types";
import { ChartCard } from "./chart-card";
import { TOTAL_COLOR, colorForFirm } from "./colors";

export function CumulativePnlChart({ points }: { points: CumulativePoint[] }) {
  if (points.length === 0) {
    return (
      <ChartCard title="Cumulative P&L">
        <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
          No fees or payouts yet
        </div>
      </ChartCard>
    );
  }
  const seriesNames = [...new Set(points.map((p) => p.series))];
  const dates = [...new Set(points.map((p) => p.date))].sort();
  const data = dates.map((date) => {
    const row: Record<string, number | string> = { date };
    for (const s of seriesNames) {
      const last = points
        .filter((p) => p.series === s && p.date <= date)
        .at(-1);
      if (last) row[s] = last.cumulative;
    }
    return row;
  });
  return (
    <ChartCard title="Cumulative P&L" subtitle="Total + per firm">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
            }}
          />
          <Legend />
          {seriesNames.map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={s === "Total" ? TOTAL_COLOR : colorForFirm(s)}
              strokeWidth={s === "Total" ? 2.5 : 1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
