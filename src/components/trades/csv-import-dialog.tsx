"use client";

import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseNinjaTraderCsv } from "@/lib/trades/parse-csv";
import { pairFillsIntoTrades } from "@/lib/trades/pair-fills";
import { detectAccount } from "@/lib/trades/account-patterns";
import type { ImportPreview } from "@/lib/trades/types";
import { CsvImportPreview } from "./csv-import-preview";

export function CsvImportDialog({
  funds,
}: {
  funds: { id: string; name: string; ntAccount: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPreview(null);
    setError(null);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function handleFile(file: File) {
    reset();
    try {
      const text = await file.text();
      const fills = parseNinjaTraderCsv(text);
      const { trades, openPositions } = pairFillsIntoTrades(fills);

      // Each account ID has a constant Connection value across its fills (NT design).
      const accountToConnection = new Map<string, string | null>();
      for (const f of fills) {
        if (!accountToConnection.has(f.account)) {
          accountToConnection.set(f.account, f.connection);
        }
      }

      const accountSuggestions = [...accountToConnection.entries()].map(
        ([account, connection]) => {
          const existing = funds.find((fnd) => fnd.ntAccount === account);
          if (existing) {
            return {
              account,
              connection,
              existingFundId: existing.id,
              existingFundName: existing.name,
              suggestedName: null,
              firm: null,
            };
          }
          const detected = detectAccount(account, connection);
          return {
            account,
            connection,
            existingFundId: null,
            existingFundName: null,
            suggestedName: detected?.suggestedName ?? null,
            firm: detected?.firm ?? null,
          };
        },
      );

      setPreview({ fills, trades, openPositions, accountSuggestions });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        Import CSV
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import NinjaTrader CSV</DialogTitle>
        </DialogHeader>
        {!preview && !error && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Export from NinjaTrader → Account Performance → CSV → upload
              here.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full"
            />
          </div>
        )}
        {error && (
          <div className="space-y-3">
            <p className="text-sm text-loss">{error}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Try another file
              </Button>
              <DialogClose className={cn(buttonVariants({ variant: "outline" }))}>
                Cancel
              </DialogClose>
            </div>
          </div>
        )}
        {preview && (
          <CsvImportPreview
            preview={preview}
            funds={funds}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
