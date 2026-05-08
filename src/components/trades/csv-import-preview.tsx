"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createFundFromImport,
  importTrades,
  setNtAccountForFund,
} from "@/lib/trades/actions";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { ImportPreview } from "@/lib/trades/types";

export function CsvImportPreview({
  preview,
  funds,
  onClose,
}: {
  preview: ImportPreview;
  funds: { id: string; name: string; ntAccount: string | null }[];
  onClose: () => void;
}) {
  const [mapping, setMapping] = useState<Record<string, string | null>>(
    preview.accountToFund,
  );
  const [extraFunds, setExtraFunds] = useState<
    { id: string; name: string; ntAccount: string | null }[]
  >([]);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);

  const allFunds = [...funds, ...extraFunds];

  // Re-resolve mapping if user has set ntAccount on funds and reopens preview
  useEffect(() => {
    setMapping(preview.accountToFund);
  }, [preview]);

  const accounts = Object.keys(preview.accountToFund);
  const allMapped = accounts.every((a) => mapping[a]);

  function handleMap(account: string, fundId: string) {
    setMapping((m) => ({ ...m, [account]: fundId }));
    // Persist to DB so future imports skip this step
    start(async () => {
      await setNtAccountForFund(fundId, account);
    });
  }

  function handleCreate(account: string) {
    const suggestedName = account;
    const name = window.prompt(
      `Create new fund for account "${account}":\n\nFund name (you can edit details later in /funds):`,
      suggestedName,
    );
    if (!name || !name.trim()) return;
    start(async () => {
      const res = await createFundFromImport({
        name: name.trim(),
        ntAccount: account,
      });
      if (res.ok && res.id) {
        setExtraFunds((prev) => [
          ...prev,
          { id: res.id!, name: name.trim(), ntAccount: account },
        ]);
        setMapping((m) => ({ ...m, [account]: res.id! }));
      } else {
        alert(`Could not create fund: ${res.error ?? "unknown error"}`);
      }
    });
  }

  function handleImport() {
    if (!allMapped) return;
    start(async () => {
      const res = await importTrades({
        trades: preview.trades,
        accountToFund: mapping as Record<string, string>,
      });
      setResult({ created: res.created, skipped: res.skipped });
    });
  }

  if (result) {
    return (
      <div className="space-y-4">
        <p>
          Imported <strong>{result.created}</strong> new trade
          {result.created === 1 ? "" : "s"}.{" "}
          {result.skipped > 0 && `${result.skipped} skipped (duplicates).`}
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p>
        Found <strong>{preview.fills.length}</strong> fills →{" "}
        <strong>{preview.trades.length}</strong> trades.
      </p>

      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Account mapping
        </div>
        <div className="space-y-2">
          {accounts.map((account) => {
            const fundId = mapping[account];
            return (
              <div key={account} className="flex items-center gap-3">
                <span className="font-mono text-xs">{account}</span>
                <span>→</span>
                {fundId ? (
                  <span className="text-profit">
                    {allFunds.find((f) => f.id === fundId)?.name ?? "?"} ✓
                  </span>
                ) : (
                  <Select
                    onValueChange={(v) => {
                      const value = v as string;
                      if (value === "__create__") {
                        handleCreate(account);
                      } else {
                        handleMap(account, value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="⚠ pick a fund" />
                    </SelectTrigger>
                    <SelectContent>
                      {allFunds.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__create__">
                        + Create new fund…
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {preview.openPositions.length > 0 && (
        <div className="rounded-lg border border-dashed p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            ⚠ {preview.openPositions.length} fill
            {preview.openPositions.length === 1 ? "" : "s"} excluded (open
            position)
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {preview.openPositions.slice(0, 5).map((f) => (
              <li key={f.id} className="font-mono">
                {f.symbol} {f.action} {f.qty} @ {formatCurrency(f.price)} ·{" "}
                {format(f.time, "MMM d HH:mm")}
              </li>
            ))}
            {preview.openPositions.length > 5 && (
              <li className="text-muted-foreground">
                + {preview.openPositions.length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!allMapped || pending}>
          {pending
            ? "Importing…"
            : `Import ${preview.trades.length} trade${preview.trades.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
