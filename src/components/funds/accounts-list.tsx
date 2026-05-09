"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FundWithStats } from "@/lib/funds/types";
import { BulkArchiveToolbar } from "./bulk-archive-toolbar";
import { InlineRenameInput } from "./inline-rename-input";
import { InlineStatusBadge } from "./inline-status-badge";

export function AccountsList({ funds }: { funds: FundWithStats[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <BulkArchiveToolbar
        selectedIds={[...selected]}
        onClear={() => setSelected(new Set())}
      />
      <div className="space-y-2">
        {funds.map((fund) => {
          const roi = fund.stats.roiPct;
          const isSelected = selected.has(fund.id);
          return (
            <div
              key={fund.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/40",
                isSelected && "border-primary/60 bg-primary/5",
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(fund.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4"
              />
              <Link
                href={`/funds?selected=${fund.id}`}
                scroll={false}
                className="flex flex-1 items-center justify-between gap-3 min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <InlineRenameInput fundId={fund.id} name={fund.name} />
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {fund.firm && <span>{fund.firm}</span>}
                    {fund.firm && <span>·</span>}
                    <span className="tabular-nums">
                      {formatCurrency(fund.accountSize)}
                    </span>
                  </div>
                </div>
                <InlineStatusBadge fundId={fund.id} status={fund.status} />
                <div className="hidden text-right sm:block">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Realized
                  </div>
                  <div
                    className={cn(
                      "font-serif text-sm tabular-nums",
                      fund.stats.realized > 0 && "text-profit",
                      fund.stats.realized < 0 && "text-loss",
                    )}
                  >
                    {formatCurrency(fund.stats.realized, { signed: true })}
                  </div>
                </div>
                <div className="hidden text-right sm:block min-w-12">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    ROI
                  </div>
                  <div
                    className={cn(
                      "font-serif text-sm tabular-nums",
                      roi !== null && roi > 0 && "text-profit",
                      roi !== null && roi < 0 && "text-loss",
                      roi === null && "text-muted-foreground",
                    )}
                  >
                    {roi === null
                      ? "—"
                      : `${roi >= 0 ? "+" : ""}${roi.toFixed(0)}%`}
                  </div>
                </div>
                <div className="hidden text-right sm:block min-w-16">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Trade P&L
                  </div>
                  {fund.status === "archived" ? (
                    <div className="font-serif text-sm tabular-nums text-muted-foreground/60">
                      —
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "font-serif text-sm tabular-nums",
                        fund.stats.tradePnl > 0 && "text-profit",
                        fund.stats.tradePnl < 0 && "text-loss",
                      )}
                    >
                      {formatCurrency(fund.stats.tradePnl, { signed: true })}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
