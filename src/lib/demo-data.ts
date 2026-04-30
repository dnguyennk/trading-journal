import type { DailyPnl, EconomicEventSummary } from "@/components/trading-calendar";
import type { TradeRow } from "@/components/trade-history-table";

export const demoPnlByDate: Record<string, DailyPnl> = {
  "2026-04-27": { date: "2026-04-27", pnl: 410.5, winRate: 1, tradeCount: 1 },
  "2026-04-30": { date: "2026-04-30", pnl: 1529, winRate: 0, tradeCount: 0 },
};

export const demoEventsByDate: Record<string, EconomicEventSummary> = {
  "2026-04-26": {
    date: "2026-04-26",
    high: 0,
    medium: 1,
    low: 0,
    titles: ["USD: President Trump..."],
  },
  "2026-04-28": {
    date: "2026-04-28",
    high: 0,
    medium: 1,
    low: 5,
    titles: ["USD: ADP Weekly Empl...", "USD: HPI m/m", "+4 more"],
  },
  "2026-04-29": {
    date: "2026-04-29",
    high: 3,
    medium: 0,
    low: 9,
    titles: ["USD: Building Permit...", "USD: Housing Starts", "+10 more"],
  },
  "2026-04-30": {
    date: "2026-04-30",
    high: 3,
    medium: 2,
    low: 5,
    titles: ["USD: Advance GDP q/q", "USD: Core PCE Price ...", "+8 more"],
  },
};

export const demoTrades: TradeRow[] = [
  {
    id: "t1",
    date: "04/27/2026",
    symbol: "MNQM6",
    netPnl: 410.5,
    pnlHigh: 410.5,
    pnlLow: 230.5,
    qty: 30,
    commission: 30,
    avgWin: 146.83,
    avgLoss: null,
    winDurationSec: 220,
    lossDurationSec: 0,
    winPct: 1,
  },
];

export const demoStats = {
  netPnl: 1939.5,
  winRate: 1,
  totalTrades: 1,
  bestStreak: 1,
};
