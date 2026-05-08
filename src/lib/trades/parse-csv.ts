import Papa from "papaparse";
import { parse as parseDate } from "date-fns";
import type { Fill } from "./types";

const REQUIRED_HEADERS = [
  "Instrument",
  "Action",
  "Quantity",
  "Price",
  "Time",
  "ID",
  "Order ID",
  "Account",
  "Commission",
] as const;

const NT_TIME_FORMAT = "M/d/yyyy h:mm:ss a";

// NinjaTrader commission may arrive as "$3.50", "$1,234.56", or plain "3.50".
// Strip $, commas, whitespace before parsing.
function parseMoney(s: string | undefined | null): number {
  if (!s) return 0;
  const cleaned = s.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function parseNinjaTraderCsv(csv: string): Fill[] {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error at row ${first.row}: ${first.message}`);
  }

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `Not a NinjaTrader Account Performance CSV. Missing columns: ${missing.join(", ")}.`,
    );
  }

  const fills: Fill[] = [];
  for (const row of parsed.data) {
    const time = parseDate(row.Time ?? "", NT_TIME_FORMAT, new Date());
    if (Number.isNaN(time.getTime())) continue; // skip malformed time rows

    const action = row.Action === "Buy" || row.Action === "Sell" ? row.Action : null;
    if (!action) continue;

    const qty = Number(row.Quantity);
    const price = Number(row.Price);
    if (Number.isNaN(qty) || Number.isNaN(price)) continue;

    fills.push({
      id: row.ID ?? "",
      orderId: row["Order ID"] ?? "",
      symbol: row.Instrument ?? "",
      action,
      qty,
      price,
      time,
      commission: parseMoney(row.Commission),
      account: row.Account ?? "",
    });
  }

  return fills;
}
