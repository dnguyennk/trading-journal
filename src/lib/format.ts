export function formatCurrency(value: number, options?: { signed?: boolean }) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(value));
  if (options?.signed) {
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
  } else if (value < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds && seconds !== 0) return "—";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min} min ${sec} sec`;
}
