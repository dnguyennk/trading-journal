"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Range = "7d" | "30d" | "90d" | "ytd" | "all" | "custom";

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  all: "All time",
  custom: "Custom",
};

function rangeToDates(range: Range): { from?: string; to?: string } {
  if (range === "all") return {};
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  else if (range === "90d") from.setDate(from.getDate() - 90);
  else if (range === "ytd") from.setMonth(0, 1);
  else return {};
  return { from: from.toISOString().slice(0, 10), to };
}

export function TradeFilters({
  funds,
  symbols,
}: {
  funds: { id: string; name: string }[];
  symbols: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, start] = useTransition();

  function update(next: Record<string, string | null | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === null || v === "" || v === "all") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    sp.delete("selected");
    start(() => router.push(`/trades?${sp.toString()}`, { scroll: false }));
  }

  function setRange(r: Range) {
    const { from, to } = rangeToDates(r);
    update({ from, to, range: r === "30d" ? undefined : r });
  }

  const rawFundId = params.get("fund") ?? "all";
  // Defensive: if URL points at a fund that no longer exists (deleted, stale link),
  // fall back to "all" instead of letting the Select render the raw UUID.
  const fundId =
    rawFundId === "all" || funds.some((f) => f.id === rawFundId)
      ? rawFundId
      : "all";
  const rawSymbol = params.get("symbol") ?? "all";
  const symbol =
    rawSymbol === "all" || symbols.includes(rawSymbol) ? rawSymbol : "all";
  const range = (params.get("range") as Range) ?? "30d";

  const hasFilters =
    fundId !== "all" || symbol !== "all" || range !== "30d";

  return (
    <div className="flex flex-wrap items-end gap-3 border-b py-4">
      <div className="min-w-48 flex-1">
        <Label className="font-mono text-[9px] uppercase tracking-wider">
          Fund
        </Label>
        <Select value={fundId} onValueChange={(v) => update({ fund: v })}>
          <SelectTrigger className="w-full overflow-hidden">
            <SelectValue className="truncate">
              {(v: string) =>
                v === "all"
                  ? "All funds"
                  : (funds.find((f) => f.id === v)?.name ?? "All funds")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All funds</SelectItem>
            {funds.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-32 flex-1">
        <Label className="font-mono text-[9px] uppercase tracking-wider">
          Symbol
        </Label>
        <Select value={symbol} onValueChange={(v) => update({ symbol: v })}>
          <SelectTrigger>
            <SelectValue>
              {(v: string) => (v === "all" ? "All symbols" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All symbols</SelectItem>
            {symbols.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-32 flex-1">
        <Label className="font-mono text-[9px] uppercase tracking-wider">
          Date range
        </Label>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger>
            <SelectValue>
              {(v: string) => RANGE_LABELS[v as Range] ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            update({ fund: undefined, symbol: undefined, range: undefined })
          }
          className="font-mono text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
