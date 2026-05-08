"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { fundEvents, funds } from "@/db/schema";

const fundSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(100),
  firm: z.string().max(100).optional().nullable(),
  accountSize: z.coerce.number().positive("Account size must be > 0"),
  maxDrawdown: z.coerce.number().nonnegative().optional().nullable(),
  profitTarget: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["evaluation", "funded", "passed", "blown", "archived"]),
  startedAt: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
});

export type FundFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function saveFund(
  _prev: FundFormState,
  formData: FormData,
): Promise<FundFormState> {
  const raw = {
    id: emptyToNull(formData.get("id")) ?? undefined,
    name: String(formData.get("name") ?? "").trim(),
    firm: emptyToNull(formData.get("firm")),
    accountSize: formData.get("accountSize"),
    maxDrawdown: emptyToNull(formData.get("maxDrawdown")),
    profitTarget: emptyToNull(formData.get("profitTarget")),
    status: String(formData.get("status") ?? "evaluation"),
    startedAt: String(formData.get("startedAt") ?? ""),
    notes: emptyToNull(formData.get("notes")),
  };

  const parsed = fundSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form for errors.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;
  const startedAt = new Date(data.startedAt);
  if (Number.isNaN(startedAt.getTime())) {
    return { ok: false, error: "Invalid start date" };
  }

  if (data.id) {
    await db
      .update(funds)
      .set({
        name: data.name,
        firm: data.firm ?? null,
        accountSize: data.accountSize,
        maxDrawdown: data.maxDrawdown ?? null,
        profitTarget: data.profitTarget ?? null,
        status: data.status,
        startedAt,
        notes: data.notes ?? null,
      })
      .where(eq(funds.id, data.id));
  } else {
    await db.insert(funds).values({
      id: crypto.randomUUID(),
      name: data.name,
      firm: data.firm ?? null,
      accountSize: data.accountSize,
      maxDrawdown: data.maxDrawdown ?? null,
      profitTarget: data.profitTarget ?? null,
      status: data.status,
      startedAt,
      notes: data.notes ?? null,
    });
  }

  revalidatePath("/funds");
  return { ok: true };
}

export async function archiveFund(id: string): Promise<void> {
  await db.update(funds).set({ status: "archived" }).where(eq(funds.id, id));
  revalidatePath("/funds");
}

export async function deleteFund(id: string): Promise<void> {
  await db.delete(funds).where(eq(funds.id, id));
  revalidatePath("/funds");
}

const eventSchema = z.object({
  fundId: z.string().min(1),
  type: z.enum([
    "eval_fee",
    "pa_fee",
    "combined_fee",
    "reset_fee",
    "activation_fee",
    "payout",
    "other_fee",
  ]),
  amount: z.coerce.number().positive("Amount must be > 0"),
  occurredAt: z.string().min(1),
  note: z.string().max(500).optional().nullable(),
});

export type FundEventFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createFundEvent(
  _prev: FundEventFormState,
  formData: FormData,
): Promise<FundEventFormState> {
  const raw = {
    fundId: String(formData.get("fundId") ?? ""),
    type: String(formData.get("type") ?? ""),
    amount: formData.get("amount"),
    occurredAt: String(formData.get("occurredAt") ?? ""),
    note: emptyToNull(formData.get("note")),
  };

  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the form for errors.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;
  const occurredAt = new Date(data.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, error: "Invalid date" };
  }

  await db.insert(fundEvents).values({
    id: crypto.randomUUID(),
    fundId: data.fundId,
    type: data.type,
    amount: data.amount,
    occurredAt,
    note: data.note ?? null,
  });

  revalidatePath("/funds");
  return { ok: true };
}

export async function deleteFundEvent(id: string): Promise<void> {
  await db.delete(fundEvents).where(eq(fundEvents.id, id));
  revalidatePath("/funds");
}

const statusEnum = z.enum([
  "evaluation",
  "funded",
  "passed",
  "blown",
  "archived",
]);

export async function changeFundStatus(
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Missing id" };
  const parsed = statusEnum.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  await db.update(funds).set({ status: parsed.data }).where(eq(funds.id, id));
  revalidatePath("/funds");
  return { ok: true };
}

const renameSchema = z.string().trim().min(1).max(80);

export async function renameFund(
  id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!id) return { ok: false, error: "Missing id" };
  const parsed = renameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: "Name must be 1–80 chars" };
  await db.update(funds).set({ name: parsed.data }).where(eq(funds.id, id));
  revalidatePath("/funds");
  return { ok: true };
}

export async function archiveFunds(
  ids: string[],
): Promise<{ ok: boolean; count: number }> {
  if (!ids.length) return { ok: true, count: 0 };
  // Drizzle bulk update via inArray
  const { inArray } = await import("drizzle-orm");
  await db
    .update(funds)
    .set({ status: "archived" })
    .where(inArray(funds.id, ids));
  revalidatePath("/funds");
  return { ok: true, count: ids.length };
}
