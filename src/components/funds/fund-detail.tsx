import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FundEvent } from "@/db/schema";
import {
  FUND_EVENT_TYPES,
  FUND_STATUSES,
  type FundWithStats,
} from "@/lib/funds/types";
import { FundFormDialog } from "./fund-form-dialog";
import { FundEventFormDialog } from "./fund-event-form-dialog";
import { FundEventRow } from "./fund-event-row";
import { FundDangerZone } from "./fund-danger-zone";

const EVENT_LABEL = Object.fromEntries(
  FUND_EVENT_TYPES.map((t) => [t.value, t.label]),
);
const STATUS_LABEL = Object.fromEntries(
  FUND_STATUSES.map((s) => [s.value, s.label]),
);

export function FundDetail({
  fund,
  events,
}: {
  fund: FundWithStats;
  events: FundEvent[];
}) {
  const startedAt = new Date(fund.startedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Header: name + edit button */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">
                {fund.name}
              </h2>
              <Badge variant="outline" className="rounded-full font-mono text-[10px] uppercase tracking-wider">
                {STATUS_LABEL[fund.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {fund.firm ?? "—"} · {formatCurrency(fund.accountSize)} · started {startedAt}
            </p>
          </div>
          <FundFormDialog
            fund={fund}
            title="Edit Fund"
            triggerVariant="outline"
            triggerSize="sm"
            triggerLabel={
              <>
                <Pencil className="mr-1.5 h-3 w-3" /> Edit
              </>
            }
          />
        </div>

        {/* Stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total Fees" value={formatCurrency(fund.stats.totalFees)} tone="loss-soft" />
          <Stat label="Total Payouts" value={formatCurrency(fund.stats.totalPayouts)} tone="profit-soft" />
          <Stat
            label="Net P&L"
            value={formatCurrency(fund.stats.netPnl, { signed: true })}
            tone={fund.stats.netPnl >= 0 ? "profit" : "loss"}
          />
          <Stat
            label="ROI"
            value={
              fund.stats.roiPct === null
                ? "—"
                : `${fund.stats.roiPct >= 0 ? "+" : ""}${fund.stats.roiPct.toFixed(1)}%`
            }
            tone={
              fund.stats.roiPct === null
                ? "neutral"
                : fund.stats.roiPct >= 0
                  ? "profit"
                  : "loss"
            }
          />
        </div>

        {/* Rules */}
        {(fund.maxDrawdown || fund.profitTarget) && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-4 text-sm">
            {fund.profitTarget !== null && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Profit Target</div>
                <div className="mt-0.5 font-serif tabular-nums">{formatCurrency(fund.profitTarget!)}</div>
              </div>
            )}
            {fund.maxDrawdown !== null && (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Max Drawdown</div>
                <div className="mt-0.5 font-serif tabular-nums">{formatCurrency(fund.maxDrawdown!)}</div>
              </div>
            )}
          </div>
        )}

        {fund.notes && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Notes</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/80">{fund.notes}</p>
          </div>
        )}
      </Card>

      {/* Events */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-semibold">Events</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fees paid in, payouts received. Drives the ROI calculation above.
            </p>
          </div>
          <div className="flex gap-2">
            <FundEventFormDialog
              fundId={fund.id}
              defaultType="eval_fee"
              triggerLabel="+ Log fee"
              triggerSize="sm"
              triggerVariant="outline"
            />
            <FundEventFormDialog
              fundId={fund.id}
              defaultType="payout"
              triggerLabel="+ Log payout"
              triggerSize="sm"
            />
          </div>
        </div>

        {events.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No events yet. Log a fee or a payout to start tracking ROI.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs">
                <tr className="text-left">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Note</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <FundEventRow key={ev.id} event={ev} label={EVENT_LABEL[ev.type]} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <FundDangerZone fundId={fund.id} status={fund.status} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "profit" | "loss" | "profit-soft" | "loss-soft" | "neutral";
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-serif text-xl tabular-nums",
          tone === "profit" && "text-profit",
          tone === "loss" && "text-loss",
          tone === "profit-soft" && "text-foreground/80",
          tone === "loss-soft" && "text-foreground/80",
          tone === "neutral" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
