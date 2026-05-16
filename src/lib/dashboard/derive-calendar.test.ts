import { describe, expect, it } from "vitest";
import type { Trade } from "@/db/schema";
import { deriveCalendarPnl } from "@/lib/dashboard/derive-calendar";

const trade = (overrides: Partial<Trade>): Trade => ({
  id: "t1",
  fundId: "f1",
  symbol: "MNQ",
  side: "long",
  qty: 1,
  entryPrice: 100,
  exitPrice: 110,
  entryAt: new Date(2026, 4, 1, 14, 0, 0),
  exitAt: new Date(2026, 4, 1, 15, 0, 0),
  pnl: 50,
  commission: 4,
  pnlHigh: null,
  pnlLow: null,
  winDurationSec: null,
  lossDurationSec: null,
  notes: null,
  screenshotUrl: null,
  importId: null,
  createdAt: new Date(2026, 4, 1),
  ...overrides,
});

describe("deriveCalendarPnl", () => {
  it("returns empty record for no trades", () => {
    expect(deriveCalendarPnl([])).toEqual({});
  });

  it("groups trades by local exitAt date", () => {
    const trades = [
      trade({ id: "a", exitAt: new Date(2026, 4, 1, 10, 0, 0), pnl: 50 }),
      trade({ id: "b", exitAt: new Date(2026, 4, 1, 15, 0, 0), pnl: -20 }),
      trade({ id: "c", exitAt: new Date(2026, 4, 2, 11, 0, 0), pnl: 15 }),
    ];
    const out = deriveCalendarPnl(trades);
    expect(out["2026-05-01"]).toEqual({
      date: "2026-05-01",
      pnl: 30,
      winRate: 0.5,
      tradeCount: 2,
    });
    expect(out["2026-05-02"]).toEqual({
      date: "2026-05-02",
      pnl: 15,
      winRate: 1,
      tradeCount: 1,
    });
  });

  it("treats pnl=0 as not a win", () => {
    const trades = [
      trade({ id: "a", pnl: 0 }),
      trade({ id: "b", pnl: 10 }),
    ];
    const out = deriveCalendarPnl(trades);
    expect(out["2026-05-01"].winRate).toBeCloseTo(0.5);
  });

  it("skips trades without exitAt", () => {
    const trades = [
      trade({ id: "a", pnl: 10 }),
      trade({ id: "b", exitAt: null, pnl: 999 }),
    ];
    const out = deriveCalendarPnl(trades);
    expect(Object.values(out)).toHaveLength(1);
    expect(out["2026-05-01"].pnl).toBe(10);
  });
});
