import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fundEvents, funds, trades, type FundEvent, type Trade } from "@/db/schema";
import { FUND_EVENT_TYPES, type FundStats, type FundWithStats, type FundsPageData } from "./types";

const FEE_TYPES = new Set(
  FUND_EVENT_TYPES.filter((t) => t.isFee).map((t) => t.value),
);

function computeStats(events: FundEvent[], trades: Trade[]): FundStats {
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

  let tradePnl = 0;
  let tradeCount = 0;
  for (const t of trades) {
    // closed trades only (have exitAt and non-null pnl)
    if (t.exitAt !== null && t.pnl !== null) {
      tradePnl += t.pnl;
      tradeCount += 1;
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

export async function getFundsWithStats(): Promise<FundWithStats[]> {
  const [allFunds, allEvents, allTrades] = await Promise.all([
    db.select().from(funds).orderBy(desc(funds.createdAt)),
    db.select().from(fundEvents),
    db.select().from(trades),
  ]);

  const eventsByFund = new Map<string, FundEvent[]>();
  for (const ev of allEvents) {
    const list = eventsByFund.get(ev.fundId) ?? [];
    list.push(ev);
    eventsByFund.set(ev.fundId, list);
  }

  const tradesByFund = new Map<string, Trade[]>();
  for (const t of allTrades) {
    const list = tradesByFund.get(t.fundId) ?? [];
    list.push(t);
    tradesByFund.set(t.fundId, list);
  }

  return allFunds.map((fund) => ({
    ...fund,
    stats: computeStats(
      eventsByFund.get(fund.id) ?? [],
      tradesByFund.get(fund.id) ?? [],
    ),
  }));
}

export async function getFundEvents(fundId: string): Promise<FundEvent[]> {
  return db
    .select()
    .from(fundEvents)
    .where(eq(fundEvents.fundId, fundId))
    .orderBy(desc(fundEvents.occurredAt));
}

export async function getFundsPageData(): Promise<FundsPageData> {
  const [allFunds, allEvents, allTrades] = await Promise.all([
    db.select().from(funds).orderBy(desc(funds.createdAt)),
    db.select().from(fundEvents),
    db.select().from(trades),
  ]);

  const eventsByFund = new Map<string, FundEvent[]>();
  for (const ev of allEvents) {
    const list = eventsByFund.get(ev.fundId) ?? [];
    list.push(ev);
    eventsByFund.set(ev.fundId, list);
  }

  const tradesByFund = new Map<string, Trade[]>();
  for (const t of allTrades) {
    const list = tradesByFund.get(t.fundId) ?? [];
    list.push(t);
    tradesByFund.set(t.fundId, list);
  }

  const fundsWithStats = allFunds.map((fund) => ({
    ...fund,
    stats: computeStats(
      eventsByFund.get(fund.id) ?? [],
      tradesByFund.get(fund.id) ?? [],
    ),
  }));

  return { funds: fundsWithStats, events: allEvents, trades: allTrades };
}
