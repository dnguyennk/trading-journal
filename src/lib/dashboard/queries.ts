import { and, desc, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  fundEvents,
  funds,
  trades,
  type Fund,
  type FundEvent,
  type Trade,
} from "@/db/schema";

export type DashboardData = {
  funds: Fund[];
  activeFunds: Fund[];
  trades: Trade[];
  events: FundEvent[];
};

export async function getDashboardData(
  fundId?: string,
): Promise<DashboardData> {
  const allFunds = await db
    .select()
    .from(funds)
    .orderBy(desc(funds.createdAt));
  const activeFunds = allFunds.filter((f) => f.status !== "archived");

  const scopeIds = fundId ? [fundId] : activeFunds.map((f) => f.id);

  if (scopeIds.length === 0) {
    return { funds: allFunds, activeFunds, trades: [], events: [] };
  }

  const [tradeRows, eventRows] = await Promise.all([
    db
      .select()
      .from(trades)
      .where(
        and(inArray(trades.fundId, scopeIds), isNotNull(trades.exitAt)),
      )
      .orderBy(desc(trades.exitAt)),
    db.select().from(fundEvents).where(inArray(fundEvents.fundId, scopeIds)),
  ]);

  return { funds: allFunds, activeFunds, trades: tradeRows, events: eventRows };
}
