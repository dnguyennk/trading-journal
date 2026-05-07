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
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
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
import { createFundEvent, type FundEventFormState } from "@/lib/funds/actions";
import { FUND_EVENT_TYPES, type FundEventType } from "@/lib/funds/types";

const initialState = { ok: false } as const;

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export function FundEventFormDialog({
  fundId,
  defaultType,
  triggerLabel,
  triggerVariant,
  triggerSize,
  triggerClassName,
}: {
  fundId: string;
  defaultType: FundEventType;
  triggerLabel: React.ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: FundEventFormState, formData: FormData) => {
      const result = await createFundEvent(prev, formData);
      if (result.ok) setOpen(false);
      return result;
    },
    initialState,
  );

  const errs = state.fieldErrors ?? {};
  const isPayout = defaultType === "payout";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: triggerVariant, size: triggerSize }),
          triggerClassName,
        )}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isPayout ? "Log payout" : "Log fee"}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="fundId" value={fundId} />

          <Field label="Type" error={errs.type?.[0]} required>
            <Select name="type" defaultValue={defaultType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {FUND_EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($)" error={errs.amount?.[0]} required>
              <Input
                name="amount"
                type="number"
                step="any"
                min="0"
                placeholder={isPayout ? "1000" : "147"}
                required
              />
            </Field>

            <Field label="Date" error={errs.occurredAt?.[0]} required>
              <Input
                name="occurredAt"
                type="date"
                defaultValue={todayLocal()}
                required
              />
            </Field>
          </div>

          <Field label="Note" error={errs.note?.[0]}>
            <Textarea
              name="note"
              placeholder="Optional context"
              rows={2}
            />
          </Field>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <DialogClose
              className={cn(
                buttonVariants({ variant: "outline" }),
              )}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
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
