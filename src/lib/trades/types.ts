import type { Trade } from "@/db/schema";

export type Fill = {
  id: string;
  orderId: string;
  symbol: string;
  action: "Buy" | "Sell";
  qty: number;
  price: number;
  time: Date;
  commission: number;
  account: string;
  connection: string | null;
};

export type PairedTrade = {
  importId: string;
  symbol: string;
  side: "long" | "short";
  qty: number;
  entryPrice: number;
  exitPrice: number;
  entryAt: Date;
  exitAt: Date;
  pnl: number;
  commission: number;
  account: string;
  fillIds: string[];
};

export type PairingResult = {
  trades: PairedTrade[];
  openPositions: Fill[];
};

export type TradeFilter = {
  fundId?: string;
  symbol?: string;
  from?: string; // ISO date YYYY-MM-DD
  to?: string;
  page?: number;
};

export type TradeWithFund = Trade & {
  fundName: string;
  firmName: string | null;
};

export type TradesPageData = {
  trades: TradeWithFund[];
  totalCount: number;
  totals: {
    netPnl: number;
    wins: number;
    losses: number;
    winPct: number;
  };
  filterOptions: {
    funds: { id: string; name: string }[];
    symbols: string[];
  };
};

export type ImportPreview = {
  fills: Fill[];
  trades: PairedTrade[];
  openPositions: Fill[];
  accountToFund: Record<string, string | null>; // null = unmapped
};
