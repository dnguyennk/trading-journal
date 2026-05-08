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
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040" }],
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
        { account: "LFE05062645440040", name: "Dup" },
        { account: "LFE05062645440041", name: "Dup" },
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
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040" }],
      existingMappings: {},
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/already exists/i);
    expect(await db.select().from(funds)).toHaveLength(1); // only the seeded one
  });

  it("rejects empty new-fund names", async () => {
    const res = await bulkImport({
      trades: [],
      newFunds: [{ account: "LFE05062645440040", name: "   " }],
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

  it("skips duplicate trades on re-import (same fundId + importId)", async () => {
    const first = await bulkImport({
      trades: [trade()],
      newFunds: [{ account: "LFE05062645440040", name: "Lucid Eval #0040" }],
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
