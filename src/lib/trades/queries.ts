import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { funds, trades } from "@/db/schema";
import type { TradeFilter, TradesPageData, TradeWithFund } from "./types";

const PAGE_SIZE = 50;

export async function getTradesPageData(
  filter: TradeFilter,
): Promise<TradesPageData> {
  const conditions = [];
  if (filter.fundId) conditions.push(eq(trades.fundId, filter.fundId));
  if (filter.symbol) conditions.push(eq(trades.symbol, filter.symbol));
  if (filter.from)
    conditions.push(gte(trades.entryAt, new Date(`${filter.from}T00:00:00Z`)));
  if (filter.to)
    conditions.push(lte(trades.entryAt, new Date(`${filter.to}T23:59:59Z`)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const page = filter.page ?? 1;
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      trade: trades,
      fundName: funds.name,
      firmName: funds.firm,
    })
    .from(trades)
    .leftJoin(funds, eq(trades.fundId, funds.id))
    .where(whereClause)
    .orderBy(desc(trades.entryAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const tradesOut: TradeWithFund[] = rows.map((r) => ({
    ...r.trade,
    fundName: r.fundName ?? "(deleted fund)",
    firmName: r.firmName,
  }));

  // Totals: separate query without pagination, but keeping filter
  const [countRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(trades)
    .where(whereClause);
  const totalCount = countRow?.count ?? 0;

  const allFiltered = await db
    .select({ pnl: trades.pnl })
    .from(trades)
    .where(whereClause);

  let netPnl = 0;
  let wins = 0;
  let losses = 0;
  for (const t of allFiltered) {
    if (t.pnl == null) continue;
    netPnl += t.pnl;
    if (t.pnl > 0) wins++;
    else if (t.pnl < 0) losses++;
  }
  const decided = wins + losses;
  const winPct = decided > 0 ? (wins / decided) * 100 : 0;

  // Filter options: distinct funds + symbols (unfiltered, so user can change)
  const allFunds = await db
    .select({ id: funds.id, name: funds.name })
    .from(funds)
    .orderBy(funds.name);
  const symbolRows = await db
    .selectDistinct({ symbol: trades.symbol })
    .from(trades)
    .orderBy(trades.symbol);

  return {
    trades: tradesOut,
    totalCount,
    totals: { netPnl, wins, losses, winPct },
    filterOptions: {
      funds: allFunds,
      symbols: symbolRows.map((s) => s.symbol),
    },
  };
}

export async function getTradeById(
  id: string,
): Promise<TradeWithFund | null> {
  const rows = await db
    .select({
      trade: trades,
      fundName: funds.name,
      firmName: funds.firm,
    })
    .from(trades)
    .leftJoin(funds, eq(trades.fundId, funds.id))
    .where(eq(trades.id, id));
  const row = rows[0];
  if (!row) return null;
  return {
    ...row.trade,
    fundName: row.fundName ?? "(deleted fund)",
    firmName: row.firmName,
  };
}

export const TRADES_PAGE_SIZE = PAGE_SIZE;
