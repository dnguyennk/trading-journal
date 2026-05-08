import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FundStats } from "@/lib/funds/types";

export function HeadlineTotals({
  totals,
  activeFundCount,
}: {
  totals: FundStats;
  activeFundCount: number;
}) {
  const { totalFees, totalPayouts, netPnl, roiPct } = totals;
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Total across {activeFundCount}{" "}
        {activeFundCount === 1 ? "fund" : "funds"}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total fees" value={formatCurrency(totalFees)} />
        <Stat label="Total payouts" value={formatCurrency(totalPayouts)} />
        <Stat
          label="Net P&L"
          value={formatCurrency(netPnl, { signed: true })}
          tone={netPnl > 0 ? "profit" : netPnl < 0 ? "loss" : "neutral"}
        />
        <Stat
          label="ROI"
          value={
            roiPct === null
              ? "—"
              : `${roiPct >= 0 ? "+" : ""}${roiPct.toFixed(1)}%`
          }
          tone={
            roiPct === null
              ? "neutral"
              : roiPct > 0
                ? "profit"
                : roiPct < 0
                  ? "loss"
                  : "neutral"
          }
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss" | "neutral";
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-serif text-2xl tabular-nums",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </div>
    </div>
  );
}
