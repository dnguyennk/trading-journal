import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { funds, trades } from "@/db/schema";
import { bulkImport } from "@/lib/trades/actions";
import type { PairedTrade } from "@/lib/trades/types";

function trade(overrides: Partial<PairedTrade> = {}): PairedTrade {
  return {
    importId: "fill-1",
    symbol: "MNQ",
    side: "long",
    qty: 1,
    entryPrice: 20000,
    exitPrice: 20010,
    entryAt: new Date("2026-05-08T09:30:00Z"),
    exitAt: new Date("2026-05-08T09:35:00Z"),
    pnl: 20,
    commission: 3,
    account: "LFE05062645440040",
    fillIds: ["fill-1"],
    ...overrides,
  };
}

describe("bulkImport", () => {
  beforeEach(async () => {
    await db.delete(trades);
    await db.delete(funds);
  });

  afterEach(async () => {
    await db.delete(trades);
    await db.delete(funds);
  });

  it("creates new funds and inserts trades atomically", async () => {
    const res = await bulkImport({
      trades: [trade()],
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040", firm: "Lucid" }],
      existingMappings: {},
    });
    expect(res.ok).toBe(true);
    expect(res.createdFunds).toBe(1);
    expect(res.createdTrades).toBe(1);
    expect(res.skippedTrades).toBe(0);

    const allFunds = await db.select().from(funds);
    expect(allFunds).toHaveLength(1);
    expect(allFunds[0]).toMatchObject({
      name: "Lucid Eval #0040",
      ntAccount: "LFE05062645440040",
      accountSize: 0,
      status: "evaluation",
    });

    const allTrades = await db.select().from(trades);
    expect(allTrades).toHaveLength(1);
    expect(allTrades[0].fundId).toBe(allFunds[0].id);
  });

  it("rejects when two new-funds entries share a name", async () => {
    const res = await bulkImport({
      trades: [],
      newFunds: [
        { account: "LFE05062645440040", name: "Dup", firm: "Lucid" },
        { account: "LFE05062645440041", name: "Dup", firm: "Lucid" },
      ],
      existingMappings: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/duplicate/i);
    expect(await db.select().from(funds)).toHaveLength(0);
  });

  it("rejects when a new-fund name collides with an existing fund", async () => {
    await db.insert(funds).values({
      id: "fund-existing",
      name: "Lucid Eval #0040",
      accountSize: 0,
      status: "evaluation",
      ntAccount: "OLDACCT",
    });
    const res = await bulkImport({
      trades: [],
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040", firm: "Lucid" }],
      existingMappings: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already exists/i);
    expect(await db.select().from(funds)).toHaveLength(1); // only the seeded one
  });

  it("rejects empty new-fund names", async () => {
    const res = await bulkImport({
      trades: [],
      newFunds: [{ account: "LFE05062645440040", name: "   ", firm: null }],
      existingMappings: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/empty/i);
  });

  it("inserts trades into existing funds via existingMappings", async () => {
    await db.insert(funds).values({
      id: "fund-1",
      name: "Existing Fund",
      accountSize: 0,
      status: "evaluation",
      ntAccount: "EXISTING-ACCT",
    });
    const res = await bulkImport({
      trades: [trade({ account: "EXISTING-ACCT", importId: "fill-x" })],
      newFunds: [],
      existingMappings: { "EXISTING-ACCT": "fund-1" },
    });
    expect(res.ok).toBe(true);
    expect(res.createdFunds).toBe(0);
    expect(res.createdTrades).toBe(1);

    const allTrades = await db.select().from(trades);
    expect(allTrades[0].fundId).toBe("fund-1");
  });

  it("persists detected firm on auto-created funds", async () => {
    const res = await bulkImport({
      trades: [],
      newFunds: [
        { account: "LFE0007", name: "Lucid Eval #0007", type: "eval", firm: "Lucid" },
        { account: "TDFYSL0001", name: "Tradeify Eval #0001", type: "eval", firm: "Tradeify" },
        { account: "UNK", name: "Unknown #1", type: null, firm: null },
      ],
      existingMappings: {},
    });
    expect(res.ok).toBe(true);

    const rows = await db.select().from(funds);
    const byName = new Map(rows.map((r) => [r.name, r.firm]));
    expect(byName.get("Lucid Eval #0007")).toBe("Lucid");
    expect(byName.get("Tradeify Eval #0001")).toBe("Tradeify");
    expect(byName.get("Unknown #1")).toBeNull();
  });

  it("maps account type to fund status: funded → funded, sim → archived, eval/null → evaluation", async () => {
    const res = await bulkImport({
      trades: [],
      newFunds: [
        { account: "LFE0001", name: "Lucid Eval #0001", type: "eval", firm: "Lucid" },
        { account: "LFF0002", name: "Lucid Funded #0002", type: "funded", firm: "Lucid" },
        { account: "Sim999", name: "Sim 999", type: "sim", firm: "Sim" },
        { account: "UNK0003", name: "Unknown #0003", type: null, firm: null },
      ],
      existingMappings: {},
    });
    expect(res.ok).toBe(true);
    expect(res.createdFunds).toBe(4);

    const rows = await db.select().from(funds);
    const byName = new Map(rows.map((r) => [r.name, r.status]));
    expect(byName.get("Lucid Eval #0001")).toBe("evaluation");
    expect(byName.get("Lucid Funded #0002")).toBe("funded");
    expect(byName.get("Sim 999")).toBe("archived");
    expect(byName.get("Unknown #0003")).toBe("evaluation");
  });

  it("skips duplicate trades on re-import (same fundId + importId)", async () => {
    const first = await bulkImport({
      trades: [trade()],
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040", firm: "Lucid" }],
      existingMappings: {},
    });
    expect(first.ok).toBe(true);

    const fundId = (await db.select().from(funds))[0].id;
    const second = await bulkImport({
      trades: [trade()],
      newFunds: [],
      existingMappings: { "LFE05062645440040": fundId },
    });
    expect(second.ok).toBe(true);
    expect(second.createdTrades).toBe(0);
    expect(second.skippedTrades).toBe(1);
    expect(await db.select().from(trades)).toHaveLength(1);
  });
});
