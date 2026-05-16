import type { Trade } from "@/db/schema";

export type StatsProps = {
  netPnl: number;
  winRate: number;
  totalTrades: number;
  bestStreak: number;
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeBestDayStreak(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const dayNet = new Map<string, number>();
  for (const t of trades) {
    if (!t.exitAt) continue;
    const key = localDateKey(t.exitAt);
    dayNet.set(key, (dayNet.get(key) ?? 0) + (t.pnl ?? 0));
  }

  const sortedDays = [...dayNet.keys()].sort();
  let current = 0;
  let best = 0;
  for (const day of sortedDays) {
    if ((dayNet.get(day) ?? 0) > 0) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

export function deriveStats(trades: Trade[]): StatsProps {
  if (trades.length === 0) {
    return { netPnl: 0, winRate: 0, totalTrades: 0, bestStreak: 0 };
  }
  let netPnl = 0;
  let wins = 0;
  for (const t of trades) {
    const pnl = t.pnl ?? 0;
    netPnl += pnl;
    if (pnl > 0) wins += 1;
  }
  return {
    netPnl,
    winRate: wins / trades.length,
    totalTrades: trades.length,
    bestStreak: computeBestDayStreak(trades),
  };
}
