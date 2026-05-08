"use server";

import { eq } from "drizzle-orm";
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

export async function bulkImport(input: {
  trades: PairedTrade[];
  newFunds: { account: string; name: string }[];
  existingMappings: Record<string, string>;
}): Promise<{
  ok: boolean;
  createdFunds: number;
  createdTrades: number;
  skippedTrades: number;
  error?: string;
}> {
  // Validate: no empty names, no duplicate names within batch.
  const trimmed = input.newFunds.map((f) => ({
    account: f.account,
    name: f.name.trim(),
  }));
  for (const f of trimmed) {
    if (!f.name) {
      return {
        ok: false,
        createdFunds: 0,
        createdTrades: 0,
        skippedTrades: 0,
        error: "Fund name cannot be empty",
      };
    }
  }
  const namesInBatch = new Set<string>();
  for (const f of trimmed) {
    const key = f.name.toLowerCase();
    if (namesInBatch.has(key)) {
      return {
        ok: false,
        createdFunds: 0,
        createdTrades: 0,
        skippedTrades: 0,
        error: `Duplicate fund name in batch: ${f.name}`,
      };
    }
    namesInBatch.add(key);
  }

  let createdFunds = 0;
  let createdTrades = 0;
  let skippedTrades = 0;

  try {
    db.transaction((tx) => {
      const accountToFund: Record<string, string> = { ...input.existingMappings };

      if (trimmed.length > 0) {
        const existingNames = tx.select({ name: funds.name }).from(funds).all();
        const lower = new Set(existingNames.map((r) => r.name.toLowerCase()));
        for (const f of trimmed) {
          if (lower.has(f.name.toLowerCase())) {
            throw new Error(`Fund name already exists: ${f.name}`);
          }
        }
      }

      for (const f of trimmed) {
        const id = crypto.randomUUID();
        tx.insert(funds)
          .values({
            id,
            name: f.name,
            accountSize: 0,
            status: "evaluation",
            ntAccount: f.account,
          })
          .run();
        accountToFund[f.account] = id;
        createdFunds++;
      }

      for (const t of input.trades) {
        const fundId = accountToFund[t.account];
        if (!fundId) {
          skippedTrades++;
          continue;
        }
        const result = tx
          .insert(trades)
          .values({
            id: crypto.randomUUID(),
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
          .onConflictDoNothing()
          .run();
        if ((result as { changes: number }).changes > 0) {
          createdTrades++;
        } else {
          skippedTrades++;
        }
      }
    });
  } catch (e) {
    return {
      ok: false,
      createdFunds: 0,
      createdTrades: 0,
      skippedTrades: 0,
      error: e instanceof Error ? e.message : "Import transaction failed",
    };
  }

  revalidatePath("/trades");
  revalidatePath("/funds");
  return { ok: true, createdFunds, createdTrades, skippedTrades };
}
