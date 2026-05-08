import { describe, expect, it } from "vitest";
import type { Fill } from "@/lib/trades/types";
import { pairFillsIntoTrades } from "@/lib/trades/pair-fills";

const f = (overrides: Partial<Fill>): Fill => ({
  id: "f1",
  orderId: "o1",
  symbol: "MNQ",
  action: "Buy",
  qty: 1,
  price: 20000,
  time: new Date("2026-05-08T09:00:00Z"),
  commission: 0,
  account: "APEX-1",
  ...overrides,
});

describe("pairFillsIntoTrades", () => {
  it("pairs simple long: buy 1 + sell 1 → 1 trade", () => {
    const fills = [
      f({ id: "f1", action: "Buy", qty: 1, price: 20000, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", action: "Sell", qty: 1, price: 20020, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const { trades, openPositions } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(1);
    expect(trades[0].side).toBe("long");
    expect(trades[0].qty).toBe(1);
    expect(trades[0].entryPrice).toBe(20000);
    expect(trades[0].exitPrice).toBe(20020);
    expect(openPositions).toHaveLength(0);
  });

  it("pairs simple short: sell 1 + buy 1 → 1 trade", () => {
    const fills = [
      f({ id: "f1", action: "Sell", qty: 1, price: 20020, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", action: "Buy", qty: 1, price: 20000, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(1);
    expect(trades[0].side).toBe("short");
    expect(trades[0].qty).toBe(1);
    expect(trades[0].pnl).toBeGreaterThan(0); // entry 20020 → exit 20000 short
  });

  it("ATM scale-out: buy 10 → sell 5 → sell 5 → 1 trade with avg exit", () => {
    const fills = [
      f({ id: "f1", action: "Buy", qty: 10, price: 20000, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", action: "Sell", qty: 5, price: 20015, time: new Date("2026-05-08T09:05:00Z") }),
      f({ id: "f3", action: "Sell", qty: 5, price: 20020, time: new Date("2026-05-08T09:10:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(1);
    expect(trades[0].qty).toBe(10);
    expect(trades[0].entryPrice).toBe(20000);
    expect(trades[0].exitPrice).toBe(20017.5); // (5*20015 + 5*20020) / 10
  });

  it("scale-in: buy 5 → buy 5 → sell 10 → 1 trade with avg entry", () => {
    const fills = [
      f({ id: "f1", action: "Buy", qty: 5, price: 20000, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", action: "Buy", qty: 5, price: 20010, time: new Date("2026-05-08T09:02:00Z") }),
      f({ id: "f3", action: "Sell", qty: 10, price: 20020, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(1);
    expect(trades[0].entryPrice).toBe(20005); // (5*20000 + 5*20010) / 10
    expect(trades[0].exitPrice).toBe(20020);
    expect(trades[0].qty).toBe(10);
  });

  it("position flip: buy 5 → sell 10 → 1 finished trade + 1 open short", () => {
    const fills = [
      f({ id: "f1", action: "Buy", qty: 5, price: 20000, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", action: "Sell", qty: 10, price: 20010, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const { trades, openPositions } = pairFillsIntoTrades(fills);
    // The first 5 of the 10-sell closes the long; the remaining 5 opens a short.
    expect(trades).toHaveLength(1);
    expect(trades[0].side).toBe("long");
    expect(trades[0].qty).toBe(5);
    expect(trades[0].entryPrice).toBe(20000);
    expect(trades[0].exitPrice).toBe(20010);
    // Remaining short 5 has no closing fill → open position
    expect(openPositions).toHaveLength(1);
    expect(openPositions[0].qty).toBe(5);
    expect(openPositions[0].action).toBe("Sell");
  });

  it("multi-symbol: MNQ + MES are independent", () => {
    const fills = [
      f({ id: "f1", symbol: "MNQ", action: "Buy", qty: 1, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", symbol: "MES", action: "Buy", qty: 1, time: new Date("2026-05-08T09:01:00Z") }),
      f({ id: "f3", symbol: "MNQ", action: "Sell", qty: 1, time: new Date("2026-05-08T09:05:00Z") }),
      f({ id: "f4", symbol: "MES", action: "Sell", qty: 1, time: new Date("2026-05-08T09:06:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(2);
    expect(new Set(trades.map((t) => t.symbol))).toEqual(new Set(["MNQ", "MES"]));
  });

  it("multi-account: same symbol across accounts is independent", () => {
    const fills = [
      f({ id: "f1", account: "APEX-1", action: "Buy", qty: 1, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", account: "APEX-2", action: "Buy", qty: 1, time: new Date("2026-05-08T09:01:00Z") }),
      f({ id: "f3", account: "APEX-1", action: "Sell", qty: 1, time: new Date("2026-05-08T09:05:00Z") }),
      f({ id: "f4", account: "APEX-2", action: "Sell", qty: 1, time: new Date("2026-05-08T09:06:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(2);
  });

  it("open position: buy with no exit → 0 trades, fill returned in openPositions", () => {
    const fills = [
      f({ id: "f1", action: "Buy", qty: 1, time: new Date("2026-05-08T09:00:00Z") }),
    ];
    const { trades, openPositions } = pairFillsIntoTrades(fills);
    expect(trades).toHaveLength(0);
    expect(openPositions).toHaveLength(1);
  });

  it("determinism: same input twice produces identical importIds", () => {
    const fills = [
      f({ id: "fA", action: "Buy", qty: 5, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "fB", action: "Sell", qty: 5, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const a = pairFillsIntoTrades(fills);
    const b = pairFillsIntoTrades(fills);
    expect(a.trades[0].importId).toBe(b.trades[0].importId);
    expect(a.trades[0].importId).toBe("fA"); // lowest by string sort
  });

  it("strips contract suffix when looking up multiplier", () => {
    const fills = [
      f({ id: "f1", symbol: "MNQ 12-25", action: "Buy", qty: 1, price: 20000, time: new Date("2026-05-08T09:00:00Z") }),
      f({ id: "f2", symbol: "MNQ 12-25", action: "Sell", qty: 1, price: 20010, time: new Date("2026-05-08T09:05:00Z") }),
    ];
    const { trades } = pairFillsIntoTrades(fills);
    // 10 points × 1 contract × MNQ multiplier (2) = $20
    expect(trades[0].pnl).toBe(20);
  });
});
