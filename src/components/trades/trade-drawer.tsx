"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Trash2, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { deleteTrade } from "@/lib/trades/actions";
import type { TradeWithFund } from "@/lib/trades/types";
import { TradeFormDialog } from "./trade-form-dialog";

export function TradeDrawer({
  trade,
  funds,
}: {
  trade: TradeWithFund | null;
  funds: { id: string; name: string }[];
}) {
  const router = useRouter();
  const open = trade !== null;

  function close() {
    const url = new URL(window.location.href);
    url.searchParams.delete("selected");
    router.push(`${url.pathname}?${url.searchParams.toString()}`, {
      scroll: false,
    });
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 isolate z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-0 right-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l bg-background p-6 shadow-xl",
            "data-open:animate-in data-open:slide-in-from-right",
            "data-closed:animate-out data-closed:slide-out-to-right",
          )}
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </DialogPrimitive.Close>
          {trade && <TradeDetailContent trade={trade} funds={funds} />}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function TradeDetailContent({
  trade,
  funds,
}: {
  trade: TradeWithFund;
  funds: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  const sideTone =
    trade.pnl != null && trade.pnl > 0
      ? "text-profit"
      : trade.pnl != null && trade.pnl < 0
        ? "text-loss"
        : "";

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {trade.fundName}
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <h2 className="font-serif text-2xl font-semibold">{trade.symbol}</h2>
          <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            {trade.side}
          </span>
        </div>
        <div className={cn("mt-2 font-serif text-3xl tabular-nums", sideTone)}>
          {trade.pnl != null
            ? formatCurrency(trade.pnl, { signed: true })
            : "—"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Detail label="Qty" value={String(trade.qty)} />
        <Detail label="Commission" value={formatCurrency(trade.commission)} />
        <Detail label="Entry price" value={formatCurrency(trade.entryPrice)} />
        <Detail
          label="Exit price"
          value={trade.exitPrice != null ? formatCurrency(trade.exitPrice) : "—"}
        />
        <Detail
          label="Entry time"
          value={new Date(trade.entryAt).toLocaleString()}
        />
        <Detail
          label="Exit time"
          value={trade.exitAt ? new Date(trade.exitAt).toLocaleString() : "—"}
        />
      </div>

      {trade.notes && (
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Notes
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {trade.importId && (
        <div className="font-mono text-[10px] text-muted-foreground">
          Imported · {trade.importId}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <TradeFormDialog
          trade={trade}
          funds={funds}
          title="Edit Trade"
          triggerLabel="Edit"
          triggerVariant="outline"
          triggerSize="sm"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this trade? This cannot be undone.")) return;
            startTransition(() => deleteTrade(trade.id));
          }}
        >
          <Trash2 className="mr-1 h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}
