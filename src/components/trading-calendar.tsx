"use client";

import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

export type DailyPnl = {
  date: string;
  pnl: number;
  winRate: number;
  tradeCount: number;
};

export type EconomicEventSummary = {
  date: string;
  high: number;
  medium: number;
  low: number;
  titles: string[];
};

type View = "pnl" | "events";

type Props = {
  pnlByDate?: Record<string, DailyPnl>;
  eventsByDate?: Record<string, EconomicEventSummary>;
  initialMonth?: Date;
  view?: View;
  onViewChange?: (view: View) => void;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function TradingCalendar({
  pnlByDate = {},
  eventsByDate = {},
  initialMonth = new Date(),
  view: controlledView,
  onViewChange,
}: Props) {
  const [month, setMonth] = useState(initialMonth);
  const [internalView, setInternalView] = useState<View>("pnl");
  const view = controlledView ?? internalView;

  const handleViewChange = (next: View) => {
    if (onViewChange) onViewChange(next);
    else setInternalView(next);
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    const result: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [month]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {view === "pnl" ? "Trading Calendar" : "Economic Calendar"}
          </h2>
          <div className="flex items-center rounded-lg border border-primary/20 bg-muted/40 p-0.5">
            <ToggleButton
              active={view === "pnl"}
              onClick={() => handleViewChange("pnl")}
            >
              PNL
            </ToggleButton>
            <ToggleButton
              active={view === "events"}
              onClick={() => handleViewChange("events")}
            >
              Events
            </ToggleButton>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-28 text-center font-serif text-sm font-semibold tracking-wide">
            {format(month, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-primary/20 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-3 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="rounded-md bg-muted/30 py-2 text-center"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-3 pb-4 pt-1.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, month);
          if (view === "pnl") {
            const pnl = pnlByDate[key];
            return (
              <PnlCell
                key={key}
                day={day}
                pnl={pnl}
                dim={!isCurrentMonth}
              />
            );
          }
          const events = eventsByDate[key];
          return (
            <EventsCell
              key={key}
              day={day}
              events={events}
              dim={!isCurrentMonth}
            />
          );
        })}
      </div>

      {view === "events" && (
        <div className="flex items-center justify-center gap-6 border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
          <LegendDot color="bg-impact-high" label="High Impact" />
          <LegendDot color="bg-impact-medium" label="Medium Impact" />
          <LegendDot color="bg-impact-low" label="Low Impact" />
        </div>
      )}
    </Card>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_14px_-4px_var(--primary)]"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PnlCell({
  day,
  pnl,
  dim,
}: {
  day: Date;
  pnl: DailyPnl | undefined;
  dim: boolean;
}) {
  const positive = pnl && pnl.pnl > 0;
  const negative = pnl && pnl.pnl < 0;
  return (
    <div
      className={cn(
        "group relative min-h-22 rounded-lg border bg-card/40 px-3 py-2 transition-all hover:border-primary/40",
        dim && "opacity-30",
        positive && "border-profit/40 bg-profit/8 ring-1 ring-profit/30",
        negative && "border-loss/40 bg-loss/8 ring-1 ring-loss/30",
        !pnl && "border-border/40",
      )}
    >
      <div className="font-serif text-base font-semibold leading-none">
        {format(day, "d")}
      </div>
      {pnl && (
        <div className="mt-3 flex flex-col items-center gap-0.5 text-center">
          <span
            className={cn(
              "font-serif text-base font-bold tabular-nums",
              positive && "text-profit",
              negative && "text-loss",
            )}
          >
            {formatCurrency(pnl.pnl, { signed: true })}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {formatPercent(pnl.winRate)}
          </span>
        </div>
      )}
    </div>
  );
}

function EventsCell({
  day,
  events,
  dim,
}: {
  day: Date;
  events: EconomicEventSummary | undefined;
  dim: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-22 rounded-lg border bg-card/40 px-3 py-2 transition-colors hover:border-primary/40",
        dim && "opacity-30",
        events?.high && "border-impact-high/40 ring-1 ring-impact-high/25",
        events && !events.high && events.medium && "border-impact-medium/40 ring-1 ring-impact-medium/25",
        !events && "border-border/40",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-serif text-base font-semibold leading-none">
          {format(day, "d")}
        </div>
      </div>
      {events && (
        <>
          <div className="mt-1.5 flex items-center gap-1">
            {events.high > 0 && (
              <ImpactBadge color="bg-impact-high text-white" count={events.high} />
            )}
            {events.medium > 0 && (
              <ImpactBadge color="bg-impact-medium text-black" count={events.medium} />
            )}
            {events.low > 0 && (
              <ImpactBadge color="bg-impact-low text-white" count={events.low} />
            )}
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-muted-foreground">
            {events.titles.slice(0, 2).map((t, i) => (
              <li key={i} className="truncate">
                {t}
              </li>
            ))}
            {events.titles.length > 2 && (
              <li className="italic">+{events.titles.length - 2} more</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function ImpactBadge({ color, count }: { color: string; count: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold",
        color,
      )}
    >
      {count}
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
