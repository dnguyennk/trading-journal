const FIRM_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const TOTAL_COLOR = "var(--primary)";

export function colorForFirm(firm: string): string {
  if (firm === "Total") return TOTAL_COLOR;
  let hash = 0;
  for (let i = 0; i < firm.length; i++) {
    hash = (hash * 31 + firm.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % FIRM_PALETTE.length;
  return FIRM_PALETTE[idx];
}
