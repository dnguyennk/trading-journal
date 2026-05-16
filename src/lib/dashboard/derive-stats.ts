import type { Trade } from "@/db/schema";

export type StatsProps = {
  netPnl: number;
  winRate: number;
  totalTrades: number;
  bestStreak: number;
};

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
    bestStreak: 0, // filled in Task 2
  };
}
