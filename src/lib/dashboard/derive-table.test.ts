import { describe, expect, it } from "vitest";
import type { Fund, Trade } from "@/db/schema";
import { deriveTradeRows } from "@/lib/dashboard/derive-table";

const fund = (overrides: Partial<Fund>): Fund => ({
  id: "f1",
  name: "Apex 50K",
  firm: "Apex",
  accountSize: 50000,
  maxDrawdown: 2500,
  profitTarget: 3000,
  status: "evaluation",
  startedAt: new Date(2026, 2, 1),
  notes: null,
  ntAccount: null,
  createdAt: new Date(2026, 2, 1),
  ...overrides,
});

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
  pnlHigh: 60,
  pnlLow: -10,
  winDurationSec: 120,
  lossDurationSec: null,
  notes: null,
  screenshotUrl: null,
  importId: null,
  createdAt: new Date(2026, 4, 1),
  ...overrides,
});

describe("deriveTradeRows", () => {
  it("maps Trade + Fund to TradeRow shape", () => {
    const trades = [trade({})];
    const funds = [fund({})];
    const rows = deriveTradeRows(trades, funds);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "t1",
      symbol: "MNQ",
      fundName: "Apex 50K",
      netPnl: 50,
      pnlHigh: 60,
      pnlLow: -10,
      qty: 1,
      commission: 4,
      avgWin: null,
      avgLoss: null,
      winDurationSec: 120,
      lossDurationSec: null,
      winPct: 1,
    });
  });

  it("sets winPct=0 for losing trades", () => {
    const rows = deriveTradeRows(
      [trade({ pnl: -10 })],
      [fund({})],
    );
    expect(rows[0].winPct).toBe(0);
  });

  it("falls back to em dash when fund not found", () => {
    const rows = deriveTradeRows(
      [trade({ fundId: "missing" })],
      [fund({})],
    );
    expect(rows[0].fundName).toBe("—");
  });

  it("applies limit (most-recent first; trust caller's order)", () => {
    const trades = [
      trade({ id: "a" }),
      trade({ id: "b" }),
      trade({ id: "c" }),
    ];
    const rows = deriveTradeRows(trades, [fund({})], 2);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("formats date as MM/dd/yyyy from exitAt", () => {
    const rows = deriveTradeRows(
      [trade({ exitAt: new Date(2026, 4, 1, 15, 0, 0) })],
      [fund({})],
    );
    expect(rows[0].date).toBe("05/01/2026");
  });
});
