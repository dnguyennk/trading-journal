import { describe, expect, it } from "vitest";
import type { FundEvent, Trade } from "@/db/schema";
import type { FundWithStats } from "@/lib/funds/types";
import {
  deriveAccountCumulative,
  deriveAccountTotals,
  deriveByFirm,
  deriveCumulativePnl,
  derivePayoutTimeline,
  deriveTotals,
} from "@/lib/funds/derive";

const baseFund = (overrides: Partial<FundWithStats>): FundWithStats => ({
  id: "f1",
  name: "Apex 50K",
  firm: "Apex",
  accountSize: 50000,
  maxDrawdown: 2500,
  profitTarget: 3000,
  status: "evaluation",
  startedAt: new Date("2026-03-01"),
  notes: null,
  ntAccount: null,
  createdAt: new Date("2026-03-01"),
  stats: {
    totalFees: 0,
    totalPayouts: 0,
    realized: 0,
    roiPct: null,
    payoutCount: 0,
    tradePnl: 0,
    tradeCount: 0,
  },
  ...overrides,
});

describe("deriveTotals", () => {
  it("sums cash totals across funds", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: {
          totalFees: 100,
          totalPayouts: 500,
          realized: 400,
          roiPct: 400,
          payoutCount: 1,
          tradePnl: 0,
          tradeCount: 0,
        },
      }),
      baseFund({
        id: "b",
        stats: {
          totalFees: 50,
          totalPayouts: 0,
          realized: -50,
          roiPct: -100,
          payoutCount: 0,
          tradePnl: 0,
          tradeCount: 0,
        },
      }),
    ];
    const t = deriveTotals(funds);
    expect(t.totalFees).toBe(150);
    expect(t.totalPayouts).toBe(500);
    expect(t.realized).toBe(350);
    expect(t.roiPct).toBeCloseTo((350 / 150) * 100);
    expect(t.payoutCount).toBe(1);
  });

  it("includes archived funds in cash totals", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: { totalFees: 100, totalPayouts: 200, realized: 100, roiPct: 100, payoutCount: 1, tradePnl: 0, tradeCount: 0 },
      }),
      baseFund({
        id: "b",
        status: "archived",
        stats: { totalFees: 999, totalPayouts: 0, realized: -999, roiPct: -100, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
    ];
    const t = deriveTotals(funds);
    expect(t.totalFees).toBe(1099);
    expect(t.realized).toBe(-899);
  });

  it("returns null ROI when no fees", () => {
    const t = deriveTotals([
      baseFund({
        id: "a",
        stats: { totalFees: 0, totalPayouts: 0, realized: 0, roiPct: null, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
    ]);
    expect(t.roiPct).toBeNull();
  });
});

describe("deriveByFirm", () => {
  it("groups funds by firm with counts and aggregates", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        firm: "Apex",
        status: "evaluation",
        stats: { totalFees: 100, totalPayouts: 500, realized: 400, roiPct: 400, payoutCount: 1, tradePnl: 0, tradeCount: 0 },
      }),
      baseFund({
        id: "b",
        firm: "Apex",
        status: "funded",
        stats: { totalFees: 50, totalPayouts: 0, realized: -50, roiPct: -100, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
      baseFund({
        id: "c",
        firm: "Tradeify",
        status: "evaluation",
        stats: { totalFees: 200, totalPayouts: 0, realized: -200, roiPct: -100, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    const apex = out.find((f) => f.firm === "Apex")!;
    expect(apex.fundCount).toBe(2);
    expect(apex.totalFees).toBe(150);
    expect(apex.realized).toBe(350);
    expect(apex.statusCounts.evaluation).toBe(1);
    expect(apex.statusCounts.funded).toBe(1);
    const tradeify = out.find((f) => f.firm === "Tradeify")!;
    expect(tradeify.fundCount).toBe(1);
  });

  it("buckets null firm as 'Other'", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "x",
        firm: null,
        stats: { totalFees: 10, totalPayouts: 0, realized: -10, roiPct: -100, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    expect(out[0].firm).toBe("Other");
  });

  it("includes archived funds in cash columns", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        firm: "Apex",
        stats: { totalFees: 100, totalPayouts: 200, realized: 100, roiPct: 100, payoutCount: 1, tradePnl: 0, tradeCount: 0 },
      }),
      baseFund({
        id: "z",
        firm: "Apex",
        status: "archived",
        stats: { totalFees: 999, totalPayouts: 0, realized: -999, roiPct: -100, payoutCount: 0, tradePnl: 0, tradeCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    expect(out[0].fundCount).toBe(2);
    expect(out[0].totalFees).toBe(1099);
    expect(out[0].realized).toBe(-899);
    expect(out[0].statusCounts.archived).toBe(1);
  });
});

describe("deriveCumulativePnl", () => {
  it("produces running totals per firm and a Total series", () => {
    const funds = [
      baseFund({ id: "a", firm: "Apex" }),
      baseFund({ id: "b", firm: "Tradeify" }),
    ];
    const events: FundEvent[] = [
      {
        id: "e1",
        fundId: "a",
        type: "eval_fee",
        amount: 100,
        occurredAt: new Date("2026-03-01"),
        note: null,
        createdAt: new Date("2026-03-01"),
      },
      {
        id: "e2",
        fundId: "a",
        type: "payout",
        amount: 500,
        occurredAt: new Date("2026-03-15"),
        note: null,
        createdAt: new Date("2026-03-15"),
      },
      {
        id: "e3",
        fundId: "b",
        type: "eval_fee",
        amount: 200,
        occurredAt: new Date("2026-03-10"),
        note: null,
        createdAt: new Date("2026-03-10"),
      },
    ];
    const points = deriveCumulativePnl(events, funds);
    const apex = points.filter((p) => p.series === "Apex");
    expect(apex.at(-1)!.cumulative).toBe(400); // -100 + 500
    const tradeify = points.filter((p) => p.series === "Tradeify");
    expect(tradeify.at(-1)!.cumulative).toBe(-200);
    const total = points.filter((p) => p.series === "Total");
    expect(total.at(-1)!.cumulative).toBe(200); // 400 - 200
  });

  it("includes events from archived funds", () => {
    const funds = [
      baseFund({ id: "a", firm: "Apex", status: "archived" }),
    ];
    const events: FundEvent[] = [
      {
        id: "e1",
        fundId: "a",
        type: "payout",
        amount: 500,
        occurredAt: new Date("2026-03-01"),
        note: null,
        createdAt: new Date("2026-03-01"),
      },
    ];
    const points = deriveCumulativePnl(events, funds);
    const apex = points.filter((p) => p.series === "Apex");
    expect(apex.at(-1)!.cumulative).toBe(500);
    const total = points.filter((p) => p.series === "Total");
    expect(total.at(-1)!.cumulative).toBe(500);
  });
});

describe("derivePayoutTimeline", () => {
  it("returns one point per payout event with fund + firm metadata", () => {
    const funds = [baseFund({ id: "a", firm: "Apex", name: "Apex 50K" })];
    const events: FundEvent[] = [
      {
        id: "e1",
        fundId: "a",
        type: "eval_fee",
        amount: 100,
        occurredAt: new Date("2026-03-01"),
        note: null,
        createdAt: new Date("2026-03-01"),
      },
      {
        id: "e2",
        fundId: "a",
        type: "payout",
        amount: 750,
        occurredAt: new Date("2026-03-20"),
        note: null,
        createdAt: new Date("2026-03-20"),
      },
    ];
    const points = derivePayoutTimeline(events, funds);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      amount: 750,
      fundId: "a",
      fundName: "Apex 50K",
      firm: "Apex",
    });
  });

  it("includes payouts from archived funds", () => {
    const funds = [
      baseFund({ id: "a", firm: "Apex", name: "Apex 50K", status: "archived" }),
    ];
    const events: FundEvent[] = [
      {
        id: "e1",
        fundId: "a",
        type: "payout",
        amount: 750,
        occurredAt: new Date("2026-03-20"),
        note: null,
        createdAt: new Date("2026-03-20"),
      },
    ];
    const points = derivePayoutTimeline(events, funds);
    expect(points).toHaveLength(1);
    expect(points[0].amount).toBe(750);
  });
});

describe("deriveAccountTotals", () => {
  it("sums tradePnl and tradeCount across non-archived funds", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: {
          totalFees: 0,
          totalPayouts: 0,
          realized: 0,
          roiPct: null,
          payoutCount: 0,
          tradePnl: 250,
          tradeCount: 5,
        },
      }),
      baseFund({
        id: "b",
        stats: {
          totalFees: 0,
          totalPayouts: 0,
          realized: 0,
          roiPct: null,
          payoutCount: 0,
          tradePnl: -100,
          tradeCount: 3,
        },
      }),
    ];
    const t = deriveAccountTotals(funds);
    expect(t.tradePnl).toBe(150);
    expect(t.tradeCount).toBe(8);
  });

  it("excludes archived funds from account totals", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: {
          totalFees: 0,
          totalPayouts: 0,
          realized: 0,
          roiPct: null,
          payoutCount: 0,
          tradePnl: 200,
          tradeCount: 4,
        },
      }),
      baseFund({
        id: "b",
        status: "archived",
        stats: {
          totalFees: 0,
          totalPayouts: 0,
          realized: 0,
          roiPct: null,
          payoutCount: 0,
          tradePnl: 9999,
          tradeCount: 99,
        },
      }),
    ];
    const t = deriveAccountTotals(funds);
    expect(t.tradePnl).toBe(200);
    expect(t.tradeCount).toBe(4);
  });
});

describe("deriveAccountCumulative", () => {
  const sampleTrade = (overrides: Partial<Trade>): Trade => ({
    id: "t1",
    fundId: "f1",
    symbol: "ES",
    side: "long",
    qty: 1,
    entryPrice: 100,
    exitPrice: 101,
    entryAt: new Date("2026-04-01"),
    exitAt: new Date("2026-04-01"),
    pnl: 50,
    commission: 0,
    pnlHigh: null,
    pnlLow: null,
    winDurationSec: null,
    lossDurationSec: null,
    notes: null,
    screenshotUrl: null,
    importId: null,
    createdAt: new Date("2026-04-01"),
    ...overrides,
  });

  it("returns running cumulative tradePnl per firm and total, sorted by exitAt", () => {
    const funds = [
      baseFund({ id: "f1", firm: "Apex" }),
      baseFund({ id: "f2", firm: "Topstep" }),
    ];
    const trades: Trade[] = [
      sampleTrade({ id: "t1", fundId: "f1", exitAt: new Date("2026-04-02"), pnl: 100 }),
      sampleTrade({ id: "t2", fundId: "f2", exitAt: new Date("2026-04-03"), pnl: 50 }),
      sampleTrade({ id: "t3", fundId: "f1", exitAt: new Date("2026-04-04"), pnl: -30 }),
    ];
    const points = deriveAccountCumulative(trades, funds);
    expect(points.length).toBe(6);
    const totals = points.filter((p) => p.series === "Total");
    expect(totals[totals.length - 1].cumulative).toBe(120);
    const apex = points.filter((p) => p.series === "Apex");
    expect(apex[apex.length - 1].cumulative).toBe(70);
  });

  it("excludes trades from archived funds", () => {
    const funds = [
      baseFund({ id: "f1", firm: "Apex", status: "archived" }),
      baseFund({ id: "f2", firm: "Topstep", status: "funded" }),
    ];
    const trades: Trade[] = [
      sampleTrade({ id: "t1", fundId: "f1", exitAt: new Date("2026-04-02"), pnl: 9999 }),
      sampleTrade({ id: "t2", fundId: "f2", exitAt: new Date("2026-04-03"), pnl: 50 }),
    ];
    const points = deriveAccountCumulative(trades, funds);
    const totals = points.filter((p) => p.series === "Total");
    expect(totals[totals.length - 1].cumulative).toBe(50);
    expect(points.find((p) => p.series === "Apex")).toBeUndefined();
  });

  it("skips open trades (null exitAt or null pnl)", () => {
    const funds = [baseFund({ id: "f1", firm: "Apex" })];
    const trades: Trade[] = [
      sampleTrade({ id: "t1", fundId: "f1", exitAt: null, pnl: null }),
      sampleTrade({ id: "t2", fundId: "f1", exitAt: new Date("2026-04-02"), pnl: null }),
      sampleTrade({ id: "t3", fundId: "f1", exitAt: new Date("2026-04-03"), pnl: 50 }),
    ];
    const points = deriveAccountCumulative(trades, funds);
    const apex = points.filter((p) => p.series === "Apex");
    expect(apex.length).toBe(1);
    expect(apex[0].cumulative).toBe(50);
  });
});
