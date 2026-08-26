"use client";

import { format } from "date-fns";
import { CalendarOff, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { DailyNoteForm } from "@/components/dashboard/daily-note-form";
import type { DayDetail } from "@/lib/dashboard/day-detail";
import { isWeekendGap } from "@/lib/dashboard/session-date";

const ET_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function DayDrawer({
  date,
  detail,
  funds,
  showFundColumn,
}: {
  date: string;
  detail: DayDetail;
  funds: { id: string; name: string }[];
  showFundColumn: boolean;
}) {
  const router = useRouter();

  function close() {
    const url = new URL(window.location.href);
    url.searchParams.delete("day");
    router.push(`${url.pathname}?${url.searchParams.toString()}`, {
      scroll: false,
    });
  }

  return (
    <DialogPrimitive.Root
      open
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
            "fixed top-0 right-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l bg-background p-6 shadow-xl",
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
          <DayDetailContent
            date={date}
            detail={detail}
            funds={funds}
            showFundColumn={showFundColumn}
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DayDetailContent({
  date,
  detail,
  funds,
  showFundColumn,
}: {
  date: string;
  detail: DayDetail;
  funds: { id: string; name: string }[];
  showFundColumn: boolean;
}) {
  // Noon anchor keeps the calendar date stable across timezones.
  const dayDate = new Date(`${date}T12:00:00`);
  const { summary, trades, note } = detail;
  const positive = summary.pnl > 0;
  const negative = summary.pnl < 0;
  const marketClosed = isWeekendGap(date);
  const fundMap = new Map(funds.map((f) => [f.id, f.name]));

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Session day · ET
        </div>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
          {format(dayDate, "EEEE, MMM d yyyy")}
        </h2>
        {marketClosed ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
            <CalendarOff className="h-3 w-3" />
            Market closed — no futures session (Saturday)
          </div>
        ) : (
          <>
            <div
              className={cn(
                "mt-2 font-serif text-3xl font-bold tabular-nums",
                positive && "text-profit",
                negative && "text-loss",
              )}
            >
              {summary.tradeCount > 0
                ? formatCurrency(summary.pnl, { signed: true })
                : "—"}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>{summary.tradeCount} trades</span>
              {summary.tradeCount > 0 && (
                <span>{formatPercent(summary.winRate)} win rate</span>
              )}
            </div>
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold">Trades</h3>
          {trades.length > 0 && (
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-2.5 font-mono text-[10px] uppercase tracking-wider text-primary"
            >
              {trades.length}
            </Badge>
          )}
        </div>
        {trades.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            No trades in this session.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border/60 rounded-lg border border-border/60">
            {trades.map((t) => {
              const pnl = t.pnl ?? 0;
              return (
                <li key={t.id}>
                  <Link
                    href={`/trades?selected=${t.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {ET_TIME_FORMATTER.format(t.exitAt ?? t.entryAt)}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-md border-primary/30 bg-primary/10 font-mono text-xs text-primary"
                    >
                      {t.symbol}
                    </Badge>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.side} · {t.qty}
                    </span>
                    {showFundColumn && (
                      <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                        {fundMap.get(t.fundId) ?? "—"}
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto font-semibold tabular-nums",
                        pnl > 0 && "text-profit",
                        pnl < 0 && "text-loss",
                      )}
                    >
                      {formatCurrency(pnl, { signed: true })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border/60 pt-4">
        <h3 className="mb-3 font-serif text-base font-semibold">Journal note</h3>
        <DailyNoteForm date={date} note={note} />
      </div>
    </div>
  );
}
