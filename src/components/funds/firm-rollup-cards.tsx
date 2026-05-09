import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FirmRollup } from "@/lib/funds/types";
import { colorForFirm } from "./charts/colors";

export function FirmRollupCards({ firms }: { firms: FirmRollup[] }) {
  if (firms.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {firms.map((f) => (
        <div
          key={f.firm}
          className="rounded-xl border bg-card p-4"
          style={{ borderLeft: `3px solid ${colorForFirm(f.firm)}` }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-serif text-lg font-semibold">{f.firm}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {f.fundCount} {f.fundCount === 1 ? "fund" : "funds"}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Mini label="Fees" value={formatCurrency(f.totalFees)} />
            <Mini label="Payouts" value={formatCurrency(f.totalPayouts)} />
            <Mini
              label="Realized"
              value={formatCurrency(f.realized, { signed: true })}
              tone={f.realized > 0 ? "profit" : f.realized < 0 ? "loss" : undefined}
            />
            <Mini
              label="ROI"
              value={
                f.roiPct === null
                  ? "—"
                  : `${f.roiPct >= 0 ? "+" : ""}${f.roiPct.toFixed(1)}%`
              }
              tone={
                f.roiPct === null
                  ? undefined
                  : f.roiPct > 0
                    ? "profit"
                    : f.roiPct < 0
                      ? "loss"
                      : undefined
              }
            />
            <Mini
              label="Trade P&L"
              value={formatCurrency(f.tradePnl, { signed: true })}
              tone={
                f.tradePnl > 0 ? "profit" : f.tradePnl < 0 ? "loss" : undefined
              }
            />
            <Mini label="Trades" value={f.tradeCount.toLocaleString()} />
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            Trade metrics exclude archived
          </div>
        </div>
      ))}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 tabular-nums",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </div>
    </div>
  );
}
