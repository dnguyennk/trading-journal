import type { Fund, Trade } from "@/db/schema";
import type { TradeRow } from "@/components/trade-history-table";

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}/${d.getFullYear()}`;
}

export function deriveTradeRows(
  trades: Trade[],
  funds: Fund[],
  limit = 50,
): TradeRow[] {
  const fundMap = new Map(funds.map((f) => [f.id, f]));
  return trades.slice(0, limit).map((t) => {
    const netPnl = t.pnl ?? 0;
    return {
      id: t.id,
      date: t.exitAt ? formatDate(t.exitAt) : "—",
      fundName: fundMap.get(t.fundId)?.name ?? "—",
      symbol: t.symbol,
      netPnl,
      pnlHigh: t.pnlHigh,
      pnlLow: t.pnlLow,
      qty: t.qty,
      commission: t.commission,
      avgWin: null,
      avgLoss: null,
      winDurationSec: t.winDurationSec,
      lossDurationSec: t.lossDurationSec,
      winPct: netPnl > 0 ? 1 : 0,
    };
  });
}
