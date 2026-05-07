"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { archiveFund, deleteFund } from "@/lib/funds/actions";
import type { Fund } from "@/db/schema";

export function FundDangerZone({
  fundId,
  status,
}: {
  fundId: string;
  status: Fund["status"];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-destructive/80">
            Danger zone
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Archiving keeps history. Deleting removes the fund and all its events permanently.
          </p>
        </div>
        <div className="flex gap-2">
          {status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!confirm("Archive this fund?")) return;
                startTransition(() => archiveFund(fundId));
              }}
            >
              Archive
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  "Permanently delete this fund and all its events? This cannot be undone.",
                )
              )
                return;
              startTransition(async () => {
                await deleteFund(fundId);
                window.location.href = "/funds";
              });
            }}
          >
            Delete fund
          </Button>
        </div>
      </div>
    </Card>
  );
}
