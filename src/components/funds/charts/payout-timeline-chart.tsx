"use client";

import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { PayoutPoint } from "@/lib/funds/types";
import type { ScatterPointItem } from "recharts/types/cartesian/Scatter";
import { ChartCard } from "./chart-card";
import { colorForFirm } from "./colors";

export function PayoutTimelineChart({ points }: { points: PayoutPoint[] }) {
  const router = useRouter();
  if (points.length === 0) {
    return (
      <ChartCard title="Payout timeline">
        <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
          No payouts yet
        </div>
      </ChartCard>
    );
  }
  const byFirm = new Map<string, PayoutPoint[]>();
  for (const p of points) {
    const list = byFirm.get(p.firm) ?? [];
    list.push(p);
    byFirm.set(p.firm, list);
  }
  return (
    <ChartCard title="Payout timeline" subtitle="Click a dot to open the fund">
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            type="category"
            stroke="var(--muted-foreground)"
          />
          <YAxis
            dataKey="amount"
            type="number"
            stroke="var(--muted-foreground)"
            tickFormatter={(v) => formatCurrency(v)}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as PayoutPoint;
              return (
                <div className="rounded border bg-popover p-2 text-xs">
                  <div className="font-semibold">{p.fundName}</div>
                  <div className="text-muted-foreground">{p.firm}</div>
                  <div className="mt-1 tabular-nums">
                    {formatCurrency(p.amount)} · {p.date}
                  </div>
                </div>
              );
            }}
          />
          {[...byFirm.entries()].map(([firm, data]) => (
            <Scatter
              key={firm}
              name={firm}
              data={data}
              fill={colorForFirm(firm)}
              onClick={(item: ScatterPointItem) => {
                const d = item.payload as PayoutPoint | undefined;
                if (d?.fundId) router.push(`/funds?selected=${d.fundId}`);
              }}
              style={{ cursor: "pointer" }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
