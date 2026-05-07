import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FundWithStats } from "@/lib/funds/types";
import { FUND_STATUSES } from "@/lib/funds/types";

const STATUS_LABEL = Object.fromEntries(
  FUND_STATUSES.map((s) => [s.value, s.label]),
);

const STATUS_TONE: Record<string, string> = {
  evaluation: "border-primary/30 bg-primary/10 text-primary",
  funded: "border-profit/30 bg-profit/10 text-profit",
  passed: "border-profit/30 bg-profit/10 text-profit",
  blown: "border-loss/30 bg-loss/10 text-loss",
  archived: "border-border bg-muted/40 text-muted-foreground",
};

export function FundList({
  funds,
  selectedId,
}: {
  funds: FundWithStats[];
  selectedId: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {funds.length} {funds.length === 1 ? "fund" : "funds"}
      </div>
      <div className="space-y-2">
        {funds.map((fund) => {
          const isSelected = fund.id === selectedId;
          const roi = fund.stats.roiPct;
          return (
            <Link
              key={fund.id}
              href={`/funds?selected=${fund.id}`}
              scroll={false}
              className="block focus:outline-none"
            >
              <Card
                className={cn(
                  "p-4 transition-colors cursor-pointer hover:border-primary/40",
                  isSelected && "border-primary/60 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-serif text-base font-semibold">
                        {fund.name}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {fund.firm && <span>{fund.firm}</span>}
                      {fund.firm && <span>·</span>}
                      <span className="tabular-nums">
                        {formatCurrency(fund.accountSize)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full font-mono text-[9px] uppercase tracking-wider",
                      STATUS_TONE[fund.status],
                    )}
                  >
                    {STATUS_LABEL[fund.status]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-2 border-t border-border/50 pt-3">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Net P&L
                    </div>
                    <div
                      className={cn(
                        "font-serif text-lg tabular-nums",
                        fund.stats.netPnl > 0 && "text-profit",
                        fund.stats.netPnl < 0 && "text-loss",
                      )}
                    >
                      {formatCurrency(fund.stats.netPnl, { signed: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      ROI
                    </div>
                    <div
                      className={cn(
                        "font-serif text-lg tabular-nums",
                        roi !== null && roi > 0 && "text-profit",
                        roi !== null && roi < 0 && "text-loss",
                        roi === null && "text-muted-foreground",
                      )}
                    >
                      {roi === null ? "—" : `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}%`}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
