import { describe, expect, it } from "vitest";
import type { Trade } from "@/db/schema";
import { deriveCalendarPnl } from "./derive-calendar";

function trade(overrides: Partial<Trade>): Trade {
  return {
    id: "t",
    fundId: "f",
    symbol: "ES",
    side: "long",
    qty: 1,
    entryPrice: 100,
    exitPrice: 101,
    entryAt: new Date("2026-05-18T14:00:00Z"),
    exitAt: new Date("2026-05-18T14:30:00Z"),
    pnl: 50,
    commission: 0,
    pnlHigh: null,
    pnlLow: null,
    winDurationSec: null,
    lossDurationSec: null,
    notes: null,
    screenshotUrl: null,
    importId: null,
    createdAt: new Date("2026-05-18T14:30:00Z"),
    ...overrides,
  };
}

// ET wall-clock helper (exact-delta convergence — see session-date.test.ts for the pattern).
function etMs(y: number, m: number, d: number, h: number, min: number): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 3; i++) {
    const parts = fmt.formatToParts(new Date(guess));
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const targetMs = Date.UTC(y, m - 1, d, h, min);
    const gotMs = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour) % 24,
      Number(map.minute),
    );
    const deltaMin = (targetMs - gotMs) / 60_000;
    if (deltaMin === 0) return new Date(guess);
    guess += deltaMin * 60_000;
  }
  return new Date(guess);
}

describe("deriveCalendarPnl", () => {
  it("returns empty for no trades", () => {
    expect(deriveCalendarPnl([])).toEqual({});
  });

  it("buckets a weekday trade into its session date", () => {
    const t = trade({ exitAt: etMs(2026, 5, 20, 14, 0), pnl: 100 }); // Wed 14:00 ET
    const out = deriveCalendarPnl([t]);
    expect(out["2026-05-20"]).toMatchObject({
      pnl: 100,
      tradeCount: 1,
      winRate: 1,
    });
  });

  it("buckets a Sunday-evening trade into Monday session", () => {
    const t = trade({ exitAt: etMs(2026, 5, 17, 22, 0), pnl: 75 });
    const out = deriveCalendarPnl([t]);
    expect(out["2026-05-18"]).toMatchObject({ pnl: 75, tradeCount: 1 });
    expect(out["2026-05-17"]).toBeUndefined();
  });

  it("treats maintenance-break (17:30 ET) trade as same day", () => {
    const t = trade({ exitAt: etMs(2026, 5, 19, 17, 30), pnl: 10 });
    const out = deriveCalendarPnl([t]);
    expect(out["2026-05-19"]).toMatchObject({ pnl: 10, tradeCount: 1 });
  });

  it("ignores open trades (no exitAt)", () => {
    const t = trade({ exitAt: null, pnl: null });
    expect(deriveCalendarPnl([t])).toEqual({});
  });

  it("aggregates win rate per session", () => {
    const trades = [
      trade({ id: "a", exitAt: etMs(2026, 5, 20, 10, 0), pnl: 100 }),
      trade({ id: "b", exitAt: etMs(2026, 5, 20, 11, 0), pnl: -50 }),
      trade({ id: "c", exitAt: etMs(2026, 5, 20, 12, 0), pnl: 25 }),
    ];
    const out = deriveCalendarPnl(trades);
    expect(out["2026-05-20"]).toMatchObject({
      pnl: 75,
      tradeCount: 3,
      winRate: 2 / 3,
    });
  });
});
