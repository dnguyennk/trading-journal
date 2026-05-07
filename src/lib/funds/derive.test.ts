import { describe, expect, it } from "vitest";
import type { FundEvent } from "@/db/schema";
import type { FundWithStats } from "@/lib/funds/types";
import {
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
  createdAt: new Date("2026-03-01"),
  stats: {
    totalFees: 0,
    totalPayouts: 0,
    netPnl: 0,
    roiPct: null,
    payoutCount: 0,
  },
  ...overrides,
});

describe("deriveTotals", () => {
  it("sums non-archived funds", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: {
          totalFees: 100,
          totalPayouts: 500,
          netPnl: 400,
          roiPct: 400,
          payoutCount: 1,
        },
      }),
      baseFund({
        id: "b",
        stats: {
          totalFees: 50,
          totalPayouts: 0,
          netPnl: -50,
          roiPct: -100,
          payoutCount: 0,
        },
      }),
    ];
    const t = deriveTotals(funds);
    expect(t.totalFees).toBe(150);
    expect(t.totalPayouts).toBe(500);
    expect(t.netPnl).toBe(350);
    expect(t.roiPct).toBeCloseTo((350 / 150) * 100);
    expect(t.payoutCount).toBe(1);
  });

  it("excludes archived funds", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        stats: { totalFees: 100, totalPayouts: 200, netPnl: 100, roiPct: 100, payoutCount: 1 },
      }),
      baseFund({
        id: "b",
        status: "archived",
        stats: { totalFees: 999, totalPayouts: 0, netPnl: -999, roiPct: -100, payoutCount: 0 },
      }),
    ];
    const t = deriveTotals(funds);
    expect(t.totalFees).toBe(100);
    expect(t.netPnl).toBe(100);
  });

  it("returns null ROI when no fees", () => {
    const t = deriveTotals([
      baseFund({
        id: "a",
        stats: { totalFees: 0, totalPayouts: 0, netPnl: 0, roiPct: null, payoutCount: 0 },
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
        stats: { totalFees: 100, totalPayouts: 500, netPnl: 400, roiPct: 400, payoutCount: 1 },
      }),
      baseFund({
        id: "b",
        firm: "Apex",
        status: "funded",
        stats: { totalFees: 50, totalPayouts: 0, netPnl: -50, roiPct: -100, payoutCount: 0 },
      }),
      baseFund({
        id: "c",
        firm: "Tradeify",
        status: "evaluation",
        stats: { totalFees: 200, totalPayouts: 0, netPnl: -200, roiPct: -100, payoutCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    const apex = out.find((f) => f.firm === "Apex")!;
    expect(apex.fundCount).toBe(2);
    expect(apex.totalFees).toBe(150);
    expect(apex.netPnl).toBe(350);
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
        stats: { totalFees: 10, totalPayouts: 0, netPnl: -10, roiPct: -100, payoutCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    expect(out[0].firm).toBe("Other");
  });

  it("excludes archived funds", () => {
    const funds: FundWithStats[] = [
      baseFund({
        id: "a",
        firm: "Apex",
        stats: { totalFees: 100, totalPayouts: 200, netPnl: 100, roiPct: 100, payoutCount: 1 },
      }),
      baseFund({
        id: "z",
        firm: "Apex",
        status: "archived",
        stats: { totalFees: 999, totalPayouts: 0, netPnl: -999, roiPct: -100, payoutCount: 0 },
      }),
    ];
    const out = deriveByFirm(funds);
    expect(out[0].fundCount).toBe(1);
    expect(out[0].totalFees).toBe(100);
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

  it("excludes events from archived funds", () => {
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
    expect(deriveCumulativePnl(events, funds)).toEqual([]);
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
});
