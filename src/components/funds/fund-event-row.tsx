"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { deleteFundEvent } from "@/lib/funds/actions";
import type { FundEvent } from "@/db/schema";

export function FundEventRow({
  event,
  label,
}: {
  event: FundEvent;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const isPayout = event.type === "payout";
  const date = new Date(event.occurredAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <tr className="border-t text-sm">
      <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">
        {date}
      </td>
      <td className="px-3 py-2">{label}</td>
      <td
        className={cn(
          "px-3 py-2 text-right font-serif tabular-nums",
          isPayout ? "text-profit" : "text-loss",
        )}
      >
        {isPayout ? "+" : "−"}
        {formatCurrency(event.amount)}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {event.note ?? "—"}
      </td>
      <td className="px-2 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this event?")) return;
            startTransition(() => deleteFundEvent(event.id));
          }}
          aria-label="Delete event"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}
