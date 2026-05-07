"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { FirmRollup } from "@/lib/funds/types";
import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

export function SpendVsEarnChart({ firms }: { firms: FirmRollup[] }) {
  if (firms.length === 0) {
    return (
      <ChartCard title="Spend vs Earn">
        <Empty msg="No firm activity yet" />
      </ChartCard>
    );
  }
  const data = firms.map((f) => ({
    firm: f.firm,
    Fees: f.totalFees,
    Payouts: f.totalPayouts,
  }));
  return (
    <ChartCard title="Spend vs Earn" subtitle="By firm">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="firm" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <ChartTooltip />
          <Legend />
          <Bar dataKey="Fees" fill="var(--loss)" />
          <Bar dataKey="Payouts" fill="var(--profit)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}
