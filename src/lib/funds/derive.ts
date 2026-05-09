import type { Fund, FundEvent, Trade } from "@/db/schema";
import type {
  CumulativePoint,
  FirmRollup,
  FundStats,
  FundStatus,
  FundWithStats,
  PayoutPoint,
} from "./types";

const FEE_TYPES = new Set<FundEvent["type"]>([
  "eval_fee",
  "pa_fee",
  "combined_fee",
  "reset_fee",
  "activation_fee",
  "other_fee",
]);

const ALL_STATUSES: FundStatus[] = [
  "evaluation",
  "funded",
  "passed",
  "blown",
  "archived",
];

function isActive(f: { status: FundStatus }): boolean {
  return f.status !== "archived";
}

function firmKey(firm: string | null): string {
  return firm && firm.trim().length > 0 ? firm : "Other";
}

export function deriveTotals(funds: FundWithStats[]): FundStats {
  let totalFees = 0;
  let totalPayouts = 0;
  let payoutCount = 0;
  let tradePnl = 0;
  let tradeCount = 0;
  for (const f of funds) {
    // CASH side: include all funds (fees are non-refundable cash out)
    totalFees += f.stats.totalFees;
    totalPayouts += f.stats.totalPayouts;
    payoutCount += f.stats.payoutCount;
    // ACCOUNT side: exclude archived (sim trades don't reflect real money)
    if (isActive(f)) {
      tradePnl += f.stats.tradePnl;
      tradeCount += f.stats.tradeCount;
    }
  }
  const realized = totalPayouts - totalFees;
  const roiPct = totalFees > 0 ? (realized / totalFees) * 100 : null;
  return {
    totalFees,
    totalPayouts,
    realized,
    roiPct,
    payoutCount,
    tradePnl,
    tradeCount,
  };
}

export function deriveByFirm(funds: FundWithStats[]): FirmRollup[] {
  const byFirm = new Map<string, FirmRollup>();
  for (const f of funds) {
    const key = firmKey(f.firm);
    let row = byFirm.get(key);
    if (!row) {
      row = {
        firm: key,
        fundCount: 0,
        totalFees: 0,
        totalPayouts: 0,
        realized: 0,
        roiPct: null,
        tradePnl: 0,
        tradeCount: 0,
        statusCounts: Object.fromEntries(
          ALL_STATUSES.map((s) => [s, 0]),
        ) as Record<FundStatus, number>,
      };
      byFirm.set(key, row);
    }
    row.fundCount += 1;
    // CASH side: include all funds
    row.totalFees += f.stats.totalFees;
    row.totalPayouts += f.stats.totalPayouts;
    row.statusCounts[f.status] += 1;
    // ACCOUNT side: exclude archived
    if (isActive(f)) {
      row.tradePnl += f.stats.tradePnl;
      row.tradeCount += f.stats.tradeCount;
    }
  }
  for (const row of byFirm.values()) {
    row.realized = row.totalPayouts - row.totalFees;
    row.roiPct =
      row.totalFees > 0 ? (row.realized / row.totalFees) * 100 : null;
  }
  return [...byFirm.values()].sort((a, b) => a.firm.localeCompare(b.firm));
}

export function deriveCumulativePnl(
  events: FundEvent[],
  funds: Pick<Fund, "id" | "firm" | "status">[],
): CumulativePoint[] {
  const fundMeta = new Map(funds.map((f) => [f.id, f]));
  const sorted = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const runningByFirm = new Map<string, number>();
  let runningTotal = 0;
  const out: CumulativePoint[] = [];
  for (const ev of sorted) {
    const fund = fundMeta.get(ev.fundId);
    if (!fund) continue; // CASH: archived funds INCLUDED
    const firm = firmKey(fund.firm);
    const delta =
      ev.type === "payout"
        ? ev.amount
        : FEE_TYPES.has(ev.type)
          ? -ev.amount
          : 0;
    if (delta === 0) continue;
    const next = (runningByFirm.get(firm) ?? 0) + delta;
    runningByFirm.set(firm, next);
    runningTotal += delta;
    const date = ev.occurredAt.toISOString().slice(0, 10);
    out.push({ date, series: firm, cumulative: next });
    out.push({ date, series: "Total", cumulative: runningTotal });
  }
  return out;
}

export function derivePayoutTimeline(
  events: FundEvent[],
  funds: Pick<Fund, "id" | "name" | "firm" | "status">[],
): PayoutPoint[] {
  const fundMeta = new Map(funds.map((f) => [f.id, f]));
  const out: PayoutPoint[] = [];
  for (const ev of events) {
    if (ev.type !== "payout") continue;
    const fund = fundMeta.get(ev.fundId);
    if (!fund) continue; // CASH: archived funds INCLUDED
    out.push({
      date: ev.occurredAt.toISOString().slice(0, 10),
      amount: ev.amount,
      fundId: fund.id,
      fundName: fund.name,
      firm: firmKey(fund.firm),
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function deriveAccountTotals(
  funds: FundWithStats[],
): { tradePnl: number; tradeCount: number } {
  let tradePnl = 0;
  let tradeCount = 0;
  for (const f of funds) {
    if (!isActive(f)) continue;
    tradePnl += f.stats.tradePnl;
    tradeCount += f.stats.tradeCount;
  }
  return { tradePnl, tradeCount };
}

export function deriveAccountCumulative(
  trades: Trade[],
  funds: Pick<Fund, "id" | "firm" | "status">[],
): CumulativePoint[] {
  const fundMeta = new Map(funds.map((f) => [f.id, f]));
  const eligible = trades.filter((t) => {
    if (t.exitAt === null || t.pnl === null) return false;
    const fund = fundMeta.get(t.fundId);
    // Skip if trade's fund isn't in the provided slice (caller passes all funds)
    // or if the fund is archived (sim trades don't reflect real account P&L).
    if (!fund || fund.status === "archived") return false;
    return true;
  });
  const sorted = [...eligible].sort(
    (a, b) => a.exitAt!.getTime() - b.exitAt!.getTime(),
  );
  const runningByFirm = new Map<string, number>();
  let runningTotal = 0;
  const out: CumulativePoint[] = [];
  for (const t of sorted) {
    const fund = fundMeta.get(t.fundId)!;
    const firm = firmKey(fund.firm);
    const next = (runningByFirm.get(firm) ?? 0) + t.pnl!;
    runningByFirm.set(firm, next);
    runningTotal += t.pnl!;
    const date = t.exitAt!.toISOString().slice(0, 10);
    out.push({ date, series: firm, cumulative: next });
    out.push({ date, series: "Total", cumulative: runningTotal });
  }
  return out;
}
