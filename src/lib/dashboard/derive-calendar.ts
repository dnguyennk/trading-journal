import type { Trade } from "@/db/schema";
import type { DailyPnl } from "@/components/trading-calendar";
import { localDateKey } from "@/lib/dashboard/date-key";

export function deriveCalendarPnl(trades: Trade[]): Record<string, DailyPnl> {
  const buckets = new Map<string, { pnl: number; wins: number; count: number }>();
  for (const t of trades) {
    if (!t.exitAt) continue;
    const key = localDateKey(t.exitAt);
    const b = buckets.get(key) ?? { pnl: 0, wins: 0, count: 0 };
    const pnl = t.pnl ?? 0;
    b.pnl += pnl;
    b.count += 1;
    if (pnl > 0) b.wins += 1;
    buckets.set(key, b);
  }

  const out: Record<string, DailyPnl> = {};
  for (const [date, b] of buckets) {
    out[date] = {
      date,
      pnl: b.pnl,
      winRate: b.count > 0 ? b.wins / b.count : 0,
      tradeCount: b.count,
    };
  }
  return out;
}
