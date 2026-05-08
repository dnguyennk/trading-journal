"use client";

import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveTrade, type TradeFormState } from "@/lib/trades/actions";
import { multiplierFor } from "@/lib/trades/symbol-multipliers";
import type { Trade } from "@/db/schema";
import type { VariantProps } from "class-variance-authority";

const initialState: TradeFormState = { ok: false };

function toLocalDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TradeFormDialog({
  trade,
  funds,
  triggerLabel = "+ New Trade",
  triggerVariant,
  triggerSize,
  triggerClassName,
  title = "New Trade",
}: {
  trade?: Trade;
  funds: { id: string; name: string }[];
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  triggerClassName?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: TradeFormState, formData: FormData) => {
      const result = await saveTrade(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    initialState,
  );
  const [symbol, setSymbol] = useState(trade?.symbol ?? "");
  const [qty, setQty] = useState(String(trade?.qty ?? ""));
  const [entry, setEntry] = useState(String(trade?.entryPrice ?? ""));
  const [exit, setExit] = useState(
    trade?.exitPrice != null ? String(trade.exitPrice) : "",
  );
  const [side, setSide] = useState<"long" | "short">(trade?.side ?? "long");

  const computedPnl = (() => {
    const q = Number(qty);
    const e = Number(entry);
    const x = Number(exit);
    if (!q || !e || !x) return "";
    const mult = multiplierFor(symbol);
    return side === "long"
      ? ((x - e) * q * mult).toFixed(2)
      : ((e - x) * q * mult).toFixed(2);
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({
            variant: triggerVariant,
            size: triggerSize,
          }),
          triggerClassName,
        )}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {trade && <input type="hidden" name="id" value={trade.id} />}
          <div>
            <Label htmlFor="fundId">Fund</Label>
            <Select name="fundId" defaultValue={trade?.fundId ?? funds[0]?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="MNQ 12-25"
                required
              />
            </div>
            <div>
              <Label htmlFor="side">Side</Label>
              <Select
                name="side"
                value={side}
                onValueChange={(v) => setSide(v as "long" | "short")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="qty">Qty</Label>
              <Input
                id="qty"
                name="qty"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="entryPrice">Entry</Label>
              <Input
                id="entryPrice"
                name="entryPrice"
                type="number"
                step="0.01"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="exitPrice">Exit</Label>
              <Input
                id="exitPrice"
                name="exitPrice"
                type="number"
                step="0.01"
                value={exit}
                onChange={(e) => setExit(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="entryAt">Entry time</Label>
              <Input
                id="entryAt"
                name="entryAt"
                type="datetime-local"
                defaultValue={toLocalDateTime(trade?.entryAt)}
                required
              />
            </div>
            <div>
              <Label htmlFor="exitAt">Exit time</Label>
              <Input
                id="exitAt"
                name="exitAt"
                type="datetime-local"
                defaultValue={toLocalDateTime(trade?.exitAt)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pnl">P&L (auto-computed; editable)</Label>
              <Input
                id="pnl"
                name="pnl"
                type="number"
                step="0.01"
                defaultValue={trade?.pnl != null ? String(trade.pnl) : computedPnl}
                placeholder={computedPnl}
              />
            </div>
            <div>
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                step="0.01"
                defaultValue={String(trade?.commission ?? 0)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={trade?.notes ?? ""}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="screenshotUrl">Screenshot URL</Label>
            <Input
              id="screenshotUrl"
              name="screenshotUrl"
              type="url"
              defaultValue={trade?.screenshotUrl ?? ""}
              placeholder="https://..."
            />
          </div>
          {state.error && (
            <p className="text-sm text-loss">{state.error}</p>
          )}
          <DialogFooter>
            <DialogClose
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
