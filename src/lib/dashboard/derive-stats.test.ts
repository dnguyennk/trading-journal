import { describe, expect, it } from "vitest";
import type { Trade } from "@/db/schema";
import { deriveStats } from "@/lib/dashboard/derive-stats";

const trade = (overrides: Partial<Trade>): Trade => ({
  id: "t1",
  fundId: "f1",
  symbol: "MNQ",
  side: "long",
  qty: 1,
  entryPrice: 100,
  exitPrice: 110,
  entryAt: new Date("2026-05-01T14:00:00Z"),
  exitAt: new Date("2026-05-01T15:00:00Z"),
  pnl: 50, // already net of commission per pair-fills.ts:49
  commission: 4,
  pnlHigh: null,
  pnlLow: null,
  winDurationSec: null,
  lossDurationSec: null,
  notes: null,
  screenshotUrl: null,
  importId: null,
  createdAt: new Date("2026-05-01"),
  ...overrides,
});

describe("deriveStats", () => {
  it("returns zeros for empty trade list", () => {
    expect(deriveStats([])).toEqual({
      netPnl: 0,
      winRate: 0,
      totalTrades: 0,
      bestStreak: 0,
    });
  });

  it("sums pnl directly (already net of commission)", () => {
    const trades = [trade({ id: "a", pnl: 100 }), trade({ id: "b", pnl: -30 })];
    const stats = deriveStats(trades);
    expect(stats.netPnl).toBe(70);
    expect(stats.totalTrades).toBe(2);
  });

  it("counts win rate based on pnl > 0", () => {
    const trades = [
      trade({ id: "a", pnl: 50 }),
      trade({ id: "b", pnl: -20 }),
      trade({ id: "c", pnl: 10 }),
      trade({ id: "d", pnl: 0 }),
    ];
    expect(deriveStats(trades).winRate).toBeCloseTo(0.5); // 2 wins / 4
  });

  it("treats null pnl as zero (schema nullable)", () => {
    const stats = deriveStats([trade({ pnl: null })]);
    expect(stats.netPnl).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.totalTrades).toBe(1);
  });
});
