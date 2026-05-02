import type { Fund, FundEvent } from "@/db/schema";

export type FundEventType = FundEvent["type"];
export type FundStatus = Fund["status"];

export const FUND_EVENT_TYPES: { value: FundEventType; label: string; isFee: boolean }[] = [
  { value: "eval_fee", label: "Evaluation fee", isFee: true },
  { value: "pa_fee", label: "PA / activation fee", isFee: true },
  { value: "combined_fee", label: "Combined eval + PA fee", isFee: true },
  { value: "reset_fee", label: "Reset fee", isFee: true },
  { value: "activation_fee", label: "Activation fee", isFee: true },
  { value: "other_fee", label: "Other fee", isFee: true },
  { value: "payout", label: "Payout", isFee: false },
];

export const FUND_STATUSES: { value: FundStatus; label: string }[] = [
  { value: "evaluation", label: "Evaluation" },
  { value: "funded", label: "Funded (PA)" },
  { value: "passed", label: "Passed" },
  { value: "blown", label: "Blown" },
  { value: "archived", label: "Archived" },
];

export type FundStats = {
  totalFees: number;
  totalPayouts: number;
  netPnl: number;
  roiPct: number | null;
  payoutCount: number;
};

export type FundWithStats = Fund & { stats: FundStats };
