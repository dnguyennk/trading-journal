"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveFund, type FundFormState } from "@/lib/funds/actions";
import type { Fund } from "@/db/schema";
import { FUND_STATUSES } from "@/lib/funds/types";

const initialState = { ok: false } as const;

function toDateInput(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d);
  // YYYY-MM-DD in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FundFormDialog({
  fund,
  trigger,
  title,
}: {
  fund?: Fund;
  trigger: React.ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: FundFormState, formData: FormData) => {
      const result = await saveFund(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    initialState,
  );

  const errs = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-3">
          {fund && <input type="hidden" name="id" value={fund.id} />}

          <Field label="Name" error={errs.name?.[0]} required>
            <Input
              name="name"
              defaultValue={fund?.name ?? ""}
              placeholder="Apex 50K #1"
              required
            />
          </Field>

          <Field label="Firm" error={errs.firm?.[0]}>
            <Input
              name="firm"
              defaultValue={fund?.firm ?? ""}
              placeholder="Apex / TopStep / Tradeify…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Account size" error={errs.accountSize?.[0]} required>
              <Input
                name="accountSize"
                type="number"
                step="any"
                min="0"
                defaultValue={fund?.accountSize ?? ""}
                placeholder="50000"
                required
              />
            </Field>

            <Field label="Status" error={errs.status?.[0]}>
              <Select name="status" defaultValue={fund?.status ?? "evaluation"}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {FUND_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Profit target ($)" error={errs.profitTarget?.[0]}>
              <Input
                name="profitTarget"
                type="number"
                step="any"
                min="0"
                defaultValue={fund?.profitTarget ?? ""}
                placeholder="3000"
              />
            </Field>

            <Field label="Max drawdown ($)" error={errs.maxDrawdown?.[0]}>
              <Input
                name="maxDrawdown"
                type="number"
                step="any"
                min="0"
                defaultValue={fund?.maxDrawdown ?? ""}
                placeholder="2500"
              />
            </Field>
          </div>

          <Field label="Started at" error={errs.startedAt?.[0]} required>
            <Input
              name="startedAt"
              type="date"
              defaultValue={toDateInput(fund?.startedAt ?? new Date())}
              required
            />
          </Field>

          <Field label="Notes" error={errs.notes?.[0]}>
            <Textarea
              name="notes"
              defaultValue={fund?.notes ?? ""}
              placeholder="Anything to remember about this fund…"
              rows={3}
            />
          </Field>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : fund ? "Save changes" : "Create fund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
