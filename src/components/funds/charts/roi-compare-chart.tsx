"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FirmRollup, FundStats } from "@/lib/funds/types";
import { ChartCard } from "./chart-card";
import { TOTAL_COLOR, colorForFirm } from "./colors";

export function RoiCompareChart({
  firms,
  totals,
}: {
  firms: FirmRollup[];
  totals: FundStats;
}) {
  const data = [
    { name: "Total", roi: totals.roiPct ?? 0, isTotal: true },
    ...firms.map((f) => ({
      name: f.firm,
      roi: f.roiPct ?? 0,
      isTotal: false,
    })),
  ];
  if (totals.roiPct === null && firms.every((f) => f.roiPct === null)) {
    return (
      <ChartCard title="ROI compare">
        <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
          No fees recorded yet
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="ROI compare" subtitle="% return on fees paid">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" stroke="var(--muted-foreground)" />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            stroke="var(--muted-foreground)"
          />
          <Tooltip
            formatter={(v) => {
              if (typeof v === "number") {
                return `${v.toFixed(1)}%`;
              }
              return v;
            }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
            }}
          />
          <Bar dataKey="roi">
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.isTotal ? TOTAL_COLOR : colorForFirm(d.name)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
