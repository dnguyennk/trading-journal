"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bulkImport } from "@/lib/trades/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImportPreview, AccountSuggestion } from "@/lib/trades/types";

type RowState =
  | { mode: "create"; name: string }
  | { mode: "existing"; fundId: string };

export function CsvImportPreview({
  preview,
  funds,
  onClose,
}: {
  preview: ImportPreview;
  funds: { id: string; name: string; ntAccount: string | null }[];
  onClose: () => void;
}) {
  const linked = preview.accountSuggestions.filter((s) => s.existingFundId);
  const suggested = preview.accountSuggestions.filter(
    (s) => !s.existingFundId && s.suggestedName,
  );
  const unknown = preview.accountSuggestions.filter(
    (s) => !s.existingFundId && !s.suggestedName,
  );

  // Per-account UI state for the "new" + "unknown" sections.
  const [rowState, setRowState] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const s of suggested) {
      init[s.account] = { mode: "create", name: s.suggestedName! };
    }
    for (const s of unknown) {
      init[s.account] = { mode: "create", name: "" };
    }
    return init;
  });

  const [pending, start] = useTransition();
  const [result, setResult] = useState<{
    createdFunds: number;
    createdTrades: number;
    skippedTrades: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state when preview changes (different file).
  useEffect(() => {
    const init: Record<string, RowState> = {};
    for (const s of suggested) {
      init[s.account] = { mode: "create", name: s.suggestedName! };
    }
    for (const s of unknown) {
      init[s.account] = { mode: "create", name: "" };
    }
    setRowState(init);
    setResult(null);
    setError(null);
  }, [preview]);

  const existingFundNames = useMemo(
    () => new Set(funds.map((f) => f.name.toLowerCase())),
    [funds],
  );

  // Validation: every actionable row must have a target.
  const validation = useMemo(() => {
    const newNames = new Set<string>();
    const errors: string[] = [];
    let newFundCount = 0;

    for (const account of [...suggested.map((s) => s.account), ...unknown.map((s) => s.account)]) {
      const r = rowState[account];
      if (!r) continue;
      if (r.mode === "create") {
        const trimmed = r.name.trim();
        if (!trimmed) {
          errors.push(`${account}: name required`);
          continue;
        }
        if (existingFundNames.has(trimmed.toLowerCase())) {
          errors.push(`${account}: name already used`);
          continue;
        }
        if (newNames.has(trimmed.toLowerCase())) {
          errors.push(`${account}: duplicate name`);
          continue;
        }
        newNames.add(trimmed.toLowerCase());
        newFundCount++;
      } else {
        if (!r.fundId) errors.push(`${account}: pick a fund`);
      }
    }

    return { errors, newFundCount, ok: errors.length === 0 };
  }, [rowState, suggested, unknown, existingFundNames]);

  function setName(account: string, name: string) {
    setRowState((s) => ({ ...s, [account]: { mode: "create", name } }));
  }

  function switchToExisting(account: string) {
    setRowState((s) => ({ ...s, [account]: { mode: "existing", fundId: "" } }));
  }

  function pickExisting(account: string, fundId: string | null) {
    if (!fundId) return;
    setRowState((s) => ({ ...s, [account]: { mode: "existing", fundId } }));
  }

  function switchToCreate(account: string, suggestion: AccountSuggestion) {
    setRowState((s) => ({
      ...s,
      [account]: { mode: "create", name: suggestion.suggestedName ?? "" },
    }));
  }

  function handleImport() {
    if (!validation.ok) return;
    const newFunds: {
      account: string;
      name: string;
      type: "eval" | "funded" | "sim" | null;
    }[] = [];
    const existingMappings: Record<string, string> = {};

    // Lookup type by account from the suggestions we received from the dialog.
    const typeByAccount = new Map<
      string,
      "eval" | "funded" | "sim" | null
    >();
    for (const s of preview.accountSuggestions) {
      typeByAccount.set(s.account, s.type);
    }

    for (const s of linked) {
      existingMappings[s.account] = s.existingFundId!;
    }
    for (const account of [...suggested.map((s) => s.account), ...unknown.map((s) => s.account)]) {
      const r = rowState[account];
      if (!r) continue;
      if (r.mode === "create") {
        newFunds.push({
          account,
          name: r.name.trim(),
          type: typeByAccount.get(account) ?? null,
        });
      } else {
        existingMappings[account] = r.fundId;
      }
    }

    start(async () => {
      const res = await bulkImport({
        trades: preview.trades,
        newFunds,
        existingMappings,
      });
      if (res.ok) {
        setResult({
          createdFunds: res.createdFunds,
          createdTrades: res.createdTrades,
          skippedTrades: res.skippedTrades,
        });
      } else {
        setError(res.error ?? "Import failed");
      }
    });
  }

  if (result) {
    return (
      <div className="space-y-4">
        <p>
          Created <strong>{result.createdFunds}</strong> fund
          {result.createdFunds === 1 ? "" : "s"} and imported{" "}
          <strong>{result.createdTrades}</strong> trade
          {result.createdTrades === 1 ? "" : "s"}.
          {result.skippedTrades > 0 &&
            ` ${result.skippedTrades} skipped (duplicates).`}
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  // Funds reachable in dropdowns: existing + not currently picked by another row.
  function fundsForRow(account: string) {
    const claimed = new Set<string>();
    for (const [a, r] of Object.entries(rowState)) {
      if (a !== account && r.mode === "existing" && r.fundId) {
        claimed.add(r.fundId);
      }
    }
    return funds.filter((f) => !claimed.has(f.id) && !f.ntAccount);
  }

  return (
    <div className="space-y-5 text-sm">
      <p>
        Found <strong>{preview.fills.length}</strong> fills →{" "}
        <strong>{preview.trades.length}</strong> trades.
      </p>

      {linked.length > 0 && (
        <section>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Already linked ({linked.length})
          </div>
          <ul className="space-y-1">
            {linked.map((s) => (
              <li key={s.account} className="flex items-center gap-2">
                <span className="font-mono text-xs">{s.account}</span>
                <span>→</span>
                <span className="text-profit">{s.existingFundName} ✓</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            New accounts — will create funds ({suggested.length})
          </div>
          <div className="space-y-2">
            {suggested.map((s) => {
              const r = rowState[s.account];
              if (r?.mode === "existing") {
                return (
                  <div
                    key={s.account}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="font-mono text-xs">{s.account}</span>
                    <span>→</span>
                    <Select
                      value={r.fundId}
                      onValueChange={(v) => pickExisting(s.account, v)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Pick a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {fundsForRow(s.account).map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchToCreate(s.account, s)}
                    >
                      Create new instead
                    </Button>
                  </div>
                );
              }
              return (
                <div
                  key={s.account}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="font-mono text-xs">{s.account}</span>
                  <span>→</span>
                  <Input
                    value={r?.mode === "create" ? r.name : ""}
                    onChange={(e) => setName(s.account, e.target.value)}
                    placeholder="Fund name"
                    className="w-64"
                  />
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => switchToExisting(s.account)}
                  >
                    use existing
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {unknown.length > 0 && (
        <section>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Unknown accounts ({unknown.length})
          </div>
          <div className="space-y-2">
            {unknown.map((s) => {
              const r = rowState[s.account];
              if (r?.mode === "existing") {
                return (
                  <div
                    key={s.account}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="font-mono text-xs">{s.account}</span>
                    <span>→</span>
                    <Select
                      value={r.fundId}
                      onValueChange={(v) => pickExisting(s.account, v)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Pick a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {fundsForRow(s.account).map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchToCreate(s.account, s)}
                    >
                      Create new instead
                    </Button>
                  </div>
                );
              }
              return (
                <div
                  key={s.account}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="font-mono text-xs">{s.account}</span>
                  <span>→</span>
                  <Input
                    value={r?.mode === "create" ? r.name : ""}
                    onChange={(e) => setName(s.account, e.target.value)}
                    placeholder="Fund name"
                    className="w-64"
                  />
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                    onClick={() => switchToExisting(s.account)}
                  >
                    use existing
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {validation.errors.length > 0 && (
        <ul className="space-y-1 text-xs text-loss">
          {validation.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-loss">{error}</p>}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!validation.ok || pending}
        >
          {pending
            ? "Importing…"
            : `Import ${preview.trades.length} trade${
                preview.trades.length === 1 ? "" : "s"
              }${
                validation.newFundCount > 0
                  ? ` into ${validation.newFundCount} new fund${
                      validation.newFundCount === 1 ? "" : "s"
                    }`
                  : ""
              }`}
        </Button>
      </div>
    </div>
  );
}
