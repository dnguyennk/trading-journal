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

describe("deriveStats.bestStreak (per trading day, skip no-trade days)", () => {
  // Helper that lets us pin exitAt easily
  const tradeOn = (date: string, pnl: number, id = date): Trade =>
    trade({ id, pnl, exitAt: new Date(`${date}T15:00:00`) });

  it("returns 0 when no trades", () => {
    expect(deriveStats([]).bestStreak).toBe(0);
  });

  it("returns 1 for single green day", () => {
    expect(deriveStats([tradeOn("2026-05-01", 50)]).bestStreak).toBe(1);
  });

  it("returns 0 when only red days", () => {
    expect(deriveStats([tradeOn("2026-05-01", -10)]).bestStreak).toBe(0);
  });

  it("counts consecutive green days as streak", () => {
    const trades = [
      tradeOn("2026-05-01", 20),
      tradeOn("2026-05-02", 30),
      tradeOn("2026-05-03", 10),
    ];
    expect(deriveStats(trades).bestStreak).toBe(3);
  });

  it("skips no-trade days (T1 green, T3 green, no T2 trade = streak 2)", () => {
    const trades = [
      tradeOn("2026-05-01", 20),
      tradeOn("2026-05-03", 30), // gap on T2
    ];
    expect(deriveStats(trades).bestStreak).toBe(2);
  });

  it("resets streak on red day", () => {
    const trades = [
      tradeOn("2026-05-01", 20),
      tradeOn("2026-05-02", -50),
      tradeOn("2026-05-03", 10),
      tradeOn("2026-05-04", 10),
    ];
    expect(deriveStats(trades).bestStreak).toBe(2); // T3, T4
  });

  it("sums multiple trades on same day before deciding green/red", () => {
    // T1: +50 -20 = +30 (green); T2: +10 -40 = -30 (red); T3: +5 (green)
    const trades = [
      tradeOn("2026-05-01", 50, "a"),
      tradeOn("2026-05-01", -20, "b"),
      tradeOn("2026-05-02", 10, "c"),
      tradeOn("2026-05-02", -40, "d"),
      tradeOn("2026-05-03", 5, "e"),
    ];
    expect(deriveStats(trades).bestStreak).toBe(1);
  });
});
