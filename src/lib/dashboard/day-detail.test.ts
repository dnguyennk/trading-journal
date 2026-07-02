import { describe, expect, it, beforeEach, vi } from "vitest";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { db } from "@/db";
import { funds, trades, dailyNotes } from "@/db/schema";
import { getDayDetail, upsertDailyNote } from "./day-detail";

// ET wall-clock helper (inlined for test independence)
function etMs(y: number, m: number, d: number, h: number, min: number): number {
  const guess = Date.UTC(y, m - 1, d, h, min);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(new Date(guess));
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const delta =
    (h - (Number(map.hour) % 24)) * 60 + (min - Number(map.minute));
  return guess + delta * 60_000;
}

function seedFund(id = "fund-A") {
  db.insert(funds).values({
    id,
    name: "Test Fund",
    accountSize: 50_000,
    status: "funded",
    startedAt: new Date(0),
    createdAt: new Date(0),
  }).run();
  return id;
}

function seedTrade(args: {
  id: string;
  fundId: string;
  exitAtMs: number;
  pnl: number;
}) {
  db.insert(trades).values({
    id: args.id,
    fundId: args.fundId,
    symbol: "ES",
    side: "long",
    qty: 1,
    entryPrice: 100,
    exitPrice: 101,
    entryAt: new Date(args.exitAtMs - 60_000),
    exitAt: new Date(args.exitAtMs),
    pnl: args.pnl,
    commission: 0,
    createdAt: new Date(args.exitAtMs),
  }).run();
}

beforeEach(() => {
  // Hard reset for isolation. Tests run serially in vitest by default
  // per file, which is what we want here.
  db.delete(dailyNotes).run();
  db.delete(trades).run();
  db.delete(funds).run();
});

describe("getDayDetail", () => {
  it("returns empty when no trades and no note", async () => {
    const result = await getDayDetail("2026-05-18");
    expect(result.trades).toEqual([]);
    expect(result.note).toBeNull();
    expect(result.summary).toEqual({ pnl: 0, winRate: 0, tradeCount: 0 });
  });

  it("includes Sun-evening trades in Monday session", async () => {
    const fundId = seedFund();
    seedTrade({ id: "t1", fundId, exitAtMs: etMs(2026, 5, 17, 22, 0), pnl: 100 }); // Sun-evening open
    seedTrade({ id: "t2", fundId, exitAtMs: etMs(2026, 5, 18, 10, 0), pnl: -40 });
    seedTrade({ id: "t3", fundId, exitAtMs: etMs(2026, 5, 18, 16, 55), pnl: 20 }); // just before 17:00 close
    seedTrade({ id: "t4", fundId, exitAtMs: etMs(2026, 5, 18, 18, 30), pnl: 999 }); // after 18:00 reopen -> Tue session
    seedTrade({ id: "t5", fundId, exitAtMs: etMs(2026, 5, 19, 9, 0), pnl: 999 });

    const result = await getDayDetail("2026-05-18");
    const ids = result.trades.map((t) => t.id).sort();
    expect(ids).toEqual(["t1", "t2", "t3"]);
    expect(result.summary).toEqual({
      pnl: 80, // 100 - 40 + 20
      winRate: 2 / 3,
      tradeCount: 3,
    });
  });

  it("filters by fundId when provided", async () => {
    const a = seedFund("fund-A");
    const b = seedFund("fund-B");
    seedTrade({ id: "ta", fundId: a, exitAtMs: etMs(2026, 5, 18, 10, 0), pnl: 10 });
    seedTrade({ id: "tb", fundId: b, exitAtMs: etMs(2026, 5, 18, 10, 0), pnl: 99 });

    const result = await getDayDetail("2026-05-18", a);
    expect(result.trades.map((t) => t.id)).toEqual(["ta"]);
    expect(result.summary.pnl).toBe(10);
  });

  it("returns note when present", async () => {
    db.insert(dailyNotes).values({
      id: "n1",
      fundId: null,
      date: "2026-05-18",
      mood: "good",
      marketRegime: "trending",
      generalNotes: "clean trend day",
      createdAt: new Date(0),
    }).run();

    const result = await getDayDetail("2026-05-18");
    expect(result.note).toMatchObject({
      date: "2026-05-18",
      mood: "good",
      marketRegime: "trending",
      generalNotes: "clean trend day",
    });
  });
});

describe("upsertDailyNote", () => {
  it("inserts a new note", async () => {
    const note = await upsertDailyNote("2026-05-18", {
      mood: "great",
      marketRegime: "trending",
      generalNotes: "felt sharp",
    });
    expect(note.date).toBe("2026-05-18");
    expect(note.mood).toBe("great");

    const fetched = await getDayDetail("2026-05-18");
    expect(fetched.note?.id).toBe(note.id);
  });

  it("updates an existing note", async () => {
    await upsertDailyNote("2026-05-18", { mood: "good" });
    const second = await upsertDailyNote("2026-05-18", { mood: "bad" });

    const fetched = await getDayDetail("2026-05-18");
    expect(fetched.note?.mood).toBe("bad");
    expect(fetched.note?.id).toBe(second.id);

    // No duplicate row created
    const all = db.select().from(dailyNotes).all();
    expect(all.length).toBe(1);
  });

  it("rejects invalid mood", async () => {
    await expect(
      upsertDailyNote("2026-05-18", { mood: "ecstatic" as never }),
    ).rejects.toThrow();
  });

  it("treats whitespace-only notes as null", async () => {
    const note = await upsertDailyNote("2026-05-18", {
      generalNotes: "   \n  ",
    });
    expect(note.generalNotes).toBeNull();
  });
});
