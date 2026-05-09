import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FundStats } from "@/lib/funds/types";

export function HeadlineTotals({
  totals,
  activeFundCount,
  totalFundCount,
}: {
  totals: FundStats;
  activeFundCount: number;
  totalFundCount: number;
}) {
  const { totalFees, totalPayouts, realized, roiPct, tradePnl, tradeCount } =
    totals;
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {totalFundCount} {totalFundCount === 1 ? "fund" : "funds"}
          {totalFundCount !== activeFundCount &&
            ` · ${activeFundCount} active`}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
          Trade metrics exclude archived
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total fees" value={formatCurrency(totalFees)} />
        <Stat label="Total payouts" value={formatCurrency(totalPayouts)} />
        <Stat
          label="Realized"
          value={formatCurrency(realized, { signed: true })}
          tone={realized > 0 ? "profit" : realized < 0 ? "loss" : "neutral"}
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
        <Stat
          label="Trade P&L"
          value={formatCurrency(tradePnl, { signed: true })}
          tone={tradePnl > 0 ? "profit" : tradePnl < 0 ? "loss" : "neutral"}
        />
        <Stat
          label="Trades"
          value={tradeCount.toLocaleString()}
          tone="neutral"
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
