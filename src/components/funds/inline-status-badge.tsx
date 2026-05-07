"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { changeFundStatus } from "@/lib/funds/actions";
import { FUND_STATUSES, type FundStatus } from "@/lib/funds/types";

const STATUS_TONE: Record<FundStatus, string> = {
  evaluation: "border-primary/30 bg-primary/10 text-primary",
  funded: "border-profit/30 bg-profit/10 text-profit",
  passed: "border-profit/30 bg-profit/10 text-profit",
  blown: "border-loss/30 bg-loss/10 text-loss",
  archived: "border-border bg-muted/40 text-muted-foreground",
};

const STATUS_LABEL: Record<FundStatus, string> = Object.fromEntries(
  FUND_STATUSES.map((s) => [s.value, s.label]),
) as Record<FundStatus, string>;

export function InlineStatusBadge({
  fundId,
  status,
}: {
  fundId: string;
  status: FundStatus;
}) {
  const [optimistic, setOptimistic] = useState(status);
  const [, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
          STATUS_TONE[optimistic],
        )}
      >
        {STATUS_LABEL[optimistic]}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {FUND_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => {
              const next = s.value;
              const prev = optimistic;
              setOptimistic(next);
              start(async () => {
                const res = await changeFundStatus(fundId, next);
                if (!res.ok) setOptimistic(prev);
              });
            }}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
