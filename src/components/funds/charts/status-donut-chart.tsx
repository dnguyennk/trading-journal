"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { FirmRollup } from "@/lib/funds/types";
import type { FundStatus } from "@/lib/funds/types";
import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";
import { colorForFirm } from "./colors";

const STATUS_LABELS: Record<FundStatus, string> = {
  evaluation: "Evaluation",
  funded: "Funded",
  passed: "Passed",
  blown: "Blown",
  archived: "Archived",
};

export function StatusDonutChart({ firms }: { firms: FirmRollup[] }) {
  const slices: { name: string; value: number; firm: string }[] = [];
  for (const f of firms) {
    for (const [status, count] of Object.entries(f.statusCounts)) {
      if (count > 0 && status !== "archived") {
        slices.push({
          name: `${f.firm} · ${STATUS_LABELS[status as FundStatus]}`,
          value: count,
          firm: f.firm,
        });
      }
    }
  }
  if (slices.length === 0) {
    return (
      <ChartCard title="Status mix">
        <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
          No active funds
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="Status mix" subtitle="By firm × status">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={colorForFirm(s.firm)} />
            ))}
          </Pie>
          <ChartTooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
