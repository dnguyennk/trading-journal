"use server";

import { and, asc, eq, gte, isNull, lt } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { dailyNotes, trades, type DailyNote, type Trade } from "@/db/schema";
import { MOODS, MARKET_REGIMES } from "@/lib/daily-notes/enums";
import { sessionDateRange } from "@/lib/dashboard/session-date";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export type DayDetail = {
  trades: Trade[];
  note: DailyNote | null;
  summary: { pnl: number; winRate: number; tradeCount: number };
};

export async function getDayDetail(
  date: string,
  fundId?: string,
): Promise<DayDetail> {
  const parsedDate = dateSchema.parse(date);
  const { startMs, endMs } = sessionDateRange(parsedDate);

  const tradeRows = db
    .select()
    .from(trades)
    .where(
      and(
        gte(trades.exitAt, new Date(startMs)),
        lt(trades.exitAt, new Date(endMs)),
        fundId ? eq(trades.fundId, fundId) : undefined,
      ),
    )
    .orderBy(asc(trades.entryAt))
    .all();

  const noteRow =
    db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.date, parsedDate), isNull(dailyNotes.fundId)))
      .limit(1)
      .all()[0] ?? null;

  let pnl = 0;
  let wins = 0;
  let count = 0;
  for (const t of tradeRows) {
    if (t.exitAt == null) continue;
    pnl += t.pnl ?? 0;
    count += 1;
    if ((t.pnl ?? 0) > 0) wins += 1;
  }

  return {
    trades: tradeRows,
    note: noteRow,
    summary: {
      pnl,
      tradeCount: count,
      winRate: count > 0 ? wins / count : 0,
    },
  };
}

const upsertSchema = z.object({
  mood: z.enum(MOODS).nullable().optional(),
  marketRegime: z.enum(MARKET_REGIMES).nullable().optional(),
  generalNotes: z.string().nullable().optional(),
});

export type UpsertDailyNoteInput = z.infer<typeof upsertSchema>;

function normalizeNotes(v: string | null | undefined): string | null {
  if (v == null) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export async function upsertDailyNote(
  date: string,
  data: UpsertDailyNoteInput,
): Promise<DailyNote> {
  const parsedDate = dateSchema.parse(date);
  const input = upsertSchema.parse(data);

  const existing =
    db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.date, parsedDate), isNull(dailyNotes.fundId)))
      .limit(1)
      .all()[0] ?? null;

  const payload = {
    mood: input.mood ?? null,
    marketRegime: input.marketRegime ?? null,
    generalNotes: normalizeNotes(input.generalNotes),
  };

  if (existing) {
    db.update(dailyNotes)
      .set(payload)
      .where(eq(dailyNotes.id, existing.id))
      .run();
    revalidatePath("/");
    return { ...existing, ...payload };
  }

  const id = randomUUID();
  const created: DailyNote = {
    id,
    fundId: null,
    date: parsedDate,
    minBalance: null,
    maxBalance: null,
    ...payload,
    createdAt: new Date(),
  };
  db.insert(dailyNotes).values(created).run();
  revalidatePath("/");
  return created;
}
