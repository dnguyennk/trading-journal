"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { funds, trades } from "@/db/schema";
import type { PairedTrade } from "./types";

const tradeSchema = z.object({
  id: z.string().optional(),
  fundId: z.string().min(1, "Fund is required"),
  symbol: z.string().trim().min(1).max(50),
  side: z.enum(["long", "short"]),
  qty: z.coerce.number().int().positive(),
  entryPrice: z.coerce.number(),
  exitPrice: z.coerce.number().optional().nullable(),
  entryAt: z.string().min(1),
  exitAt: z.string().optional().nullable(),
  pnl: z.coerce.number().optional().nullable(),
  commission: z.coerce.number().nonnegative().default(0),
  notes: z.string().max(2000).optional().nullable(),
  screenshotUrl: z
    .string()
    .url()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export type TradeFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function saveTrade(
  _prev: TradeFormState,
  formData: FormData,
): Promise<TradeFormState> {
  const raw = {
    id: emptyToNull(formData.get("id")) ?? undefined,
    fundId: String(formData.get("fundId") ?? ""),
    symbol: String(formData.get("symbol") ?? "").trim(),
    side: String(formData.get("side") ?? "long"),
    qty: formData.get("qty"),
    entryPrice: formData.get("entryPrice"),
    exitPrice: emptyToNull(formData.get("exitPrice")),
    entryAt: String(formData.get("entryAt") ?? ""),
    exitAt: emptyToNull(formData.get("exitAt")),
    pnl: emptyToNull(formData.get("pnl")),
    commission: formData.get("commission") ?? 0,
    notes: emptyToNull(formData.get("notes")),
    screenshotUrl: emptyToNull(formData.get("screenshotUrl")),
  };

  const parsed = tradeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form for errors.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;
  const entryAt = new Date(data.entryAt);
  if (Number.isNaN(entryAt.getTime())) {
    return { ok: false, error: "Invalid entry time" };
  }
  const exitAt =
    data.exitAt && data.exitAt !== "" ? new Date(data.exitAt) : null;
  if (exitAt && Number.isNaN(exitAt.getTime())) {
    return { ok: false, error: "Invalid exit time" };
  }

  const id = data.id ?? crypto.randomUUID();
  const values = {
    id,
    fundId: data.fundId,
    symbol: data.symbol,
    side: data.side,
    qty: data.qty,
    entryPrice: data.entryPrice,
    exitPrice: data.exitPrice ?? null,
    entryAt,
    exitAt,
    pnl: data.pnl ?? null,
    commission: data.commission ?? 0,
    notes: data.notes ?? null,
    screenshotUrl: data.screenshotUrl ?? null,
  };

  if (data.id) {
    await db.update(trades).set(values).where(eq(trades.id, data.id));
  } else {
    await db.insert(trades).values(values);
  }

  revalidatePath("/trades");
  revalidatePath("/funds");
  return { ok: true, id };
}

export async function deleteTrade(id: string): Promise<void> {
  await db.delete(trades).where(eq(trades.id, id));
  revalidatePath("/trades");
  revalidatePath("/funds");
}

export async function setNtAccountForFund(
  fundId: string,
  ntAccount: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!fundId || !ntAccount.trim()) {
    return { ok: false, error: "Missing fundId or account" };
  }
  await db
    .update(funds)
    .set({ ntAccount: ntAccount.trim() })
    .where(eq(funds.id, fundId));
  revalidatePath("/funds");
  return { ok: true };
}

export async function importTrades(input: {
  trades: PairedTrade[];
  accountToFund: Record<string, string>;
}): Promise<{ ok: boolean; created: number; skipped: number; error?: string }> {
  let created = 0;
  let skipped = 0;
  for (const t of input.trades) {
    const fundId = input.accountToFund[t.account];
    if (!fundId) {
      skipped++;
      continue;
    }
    const id = crypto.randomUUID();
    const result = await db
      .insert(trades)
      .values({
        id,
        fundId,
        symbol: t.symbol,
        side: t.side,
        qty: t.qty,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        entryAt: t.entryAt,
        exitAt: t.exitAt,
        pnl: t.pnl,
        commission: t.commission,
        importId: t.importId,
      })
      .onConflictDoNothing();
    // result.changes === 1 if inserted, 0 if conflicted
    if ((result as { changes: number }).changes > 0) {
      created++;
    } else {
      skipped++;
    }
  }
  revalidatePath("/trades");
  revalidatePath("/funds");
  return { ok: true, created, skipped };
}
