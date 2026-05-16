"use client";

import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Fund } from "@/db/schema";
import { cn } from "@/lib/utils";

type Props = {
  funds: Fund[];
  activeFunds: Fund[];
  selectedId?: string;
};

function fundLabel(f: Fund): string {
  const size = `${Math.round(f.accountSize / 1000)}K`;
  return `${f.name} · ${size}`;
}

export function FundFilter({ funds, activeFunds, selectedId }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const selectedFund = selectedId
    ? funds.find((f) => f.id === selectedId)
    : null;
  const selectedIsArchived =
    selectedFund && selectedFund.status === "archived";

  function go(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("fund", id);
    else next.delete("fund");
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  const triggerLabel = selectedFund ? fundLabel(selectedFund) : "All funds";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-1.5",
              "font-mono text-xs uppercase tracking-wider text-foreground/90",
              "hover:border-primary/40 hover:bg-primary/10",
            )}
          >
            <span>{triggerLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Scope
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => go(null)}
            className={cn(!selectedId && "bg-primary/5")}
          >
            All funds
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {activeFunds.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuGroup>
          {activeFunds.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => go(f.id)}
              className={cn(selectedId === f.id && "bg-primary/5")}
            >
              {fundLabel(f)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {selectedIsArchived && selectedFund && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Archived
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => go(selectedFund.id)}
                className="bg-primary/5"
              >
                {fundLabel(selectedFund)}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
