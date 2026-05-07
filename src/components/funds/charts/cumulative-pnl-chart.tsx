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
  const sortedPoints = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const dates = [...new Set(sortedPoints.map((p) => p.date))];
  // For each (date, series), find the last value at or before that date.
  // Walk dates in order; maintain a "last seen" map per series.
  const lastBySeries = new Map<string, number>();
  let pi = 0;
  const data: Record<string, number | string>[] = [];
  for (const date of dates) {
    while (pi < sortedPoints.length && sortedPoints[pi].date <= date) {
      lastBySeries.set(sortedPoints[pi].series, sortedPoints[pi].cumulative);
      pi++;
    }
    const row: Record<string, number | string> = { date };
    for (const s of seriesNames) {
      const v = lastBySeries.get(s);
      if (v !== undefined) row[s] = v;
    }
    data.push(row);
  }
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
