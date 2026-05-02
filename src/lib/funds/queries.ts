import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fundEvents, funds, type FundEvent } from "@/db/schema";
import { FUND_EVENT_TYPES, type FundStats, type FundWithStats } from "./types";

const FEE_TYPES = new Set(
  FUND_EVENT_TYPES.filter((t) => t.isFee).map((t) => t.value),
);

function computeStats(events: FundEvent[]): FundStats {
  let totalFees = 0;
  let totalPayouts = 0;
  let payoutCount = 0;

  for (const ev of events) {
    if (ev.type === "payout") {
      totalPayouts += ev.amount;
      payoutCount += 1;
    } else if (FEE_TYPES.has(ev.type)) {
      totalFees += ev.amount;
    }
  }

  const netPnl = totalPayouts - totalFees;
  const roiPct = totalFees > 0 ? (netPnl / totalFees) * 100 : null;

  return { totalFees, totalPayouts, netPnl, roiPct, payoutCount };
}

export async function getFundsWithStats(): Promise<FundWithStats[]> {
  const allFunds = await db.select().from(funds).orderBy(desc(funds.createdAt));
  const allEvents = await db.select().from(fundEvents);

  const eventsByFund = new Map<string, FundEvent[]>();
  for (const ev of allEvents) {
    const list = eventsByFund.get(ev.fundId) ?? [];
    list.push(ev);
    eventsByFund.set(ev.fundId, list);
  }

  return allFunds.map((fund) => ({
    ...fund,
    stats: computeStats(eventsByFund.get(fund.id) ?? []),
  }));
}

export async function getFundEvents(fundId: string): Promise<FundEvent[]> {
  return db
    .select()
    .from(fundEvents)
    .where(eq(fundEvents.fundId, fundId))
    .orderBy(desc(fundEvents.occurredAt));
}
