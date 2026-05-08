import { AppHeader } from "@/components/app-header";
import { CsvImportDialog } from "@/components/trades/csv-import-dialog";
import { TradeDrawer } from "@/components/trades/trade-drawer";
import { TradeFilters } from "@/components/trades/trade-filters";
import { TradeFormDialog } from "@/components/trades/trade-form-dialog";
import { TradesTable } from "@/components/trades/trades-table";
import { db } from "@/db";
import { funds } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  TRADES_PAGE_SIZE,
  getTradeById,
  getTradesPageData,
} from "@/lib/trades/queries";

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{
    fund?: string;
    symbol?: string;
    range?: string;
    from?: string;
    to?: string;
    page?: string;
    selected?: string;
  }>;
}) {
  const sp = await searchParams;
  const filter = {
    fundId: sp.fund,
    symbol: sp.symbol,
    from: sp.from,
    to: sp.to,
    page: sp.page ? Number(sp.page) : 1,
  };
  // Default range = last 30d if nothing set
  if (!filter.from && !filter.to && !sp.range) {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    filter.from = from.toISOString().slice(0, 10);
    filter.to = today.toISOString().slice(0, 10);
  }

  const data = await getTradesPageData(filter);
  const allFunds = await db
    .select({ id: funds.id, name: funds.name, ntAccount: funds.ntAccount })
    .from(funds)
    .orderBy(funds.name);
  const fundsForForm = allFunds.map((f) => ({ id: f.id, name: f.name }));

  const selectedTrade = sp.selected ? await getTradeById(sp.selected) : null;

  const { totals } = data;
  const winLossText =
    totals.wins + totals.losses === 0
      ? `${data.totalCount} trades`
      : `${data.totalCount} trades · ${totals.wins}W / ${totals.losses}L · ${totals.winPct.toFixed(0)}% win`;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-350 flex-1 space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Trades
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All your trades — manual entry or NinjaTrader CSV import.
            </p>
          </div>
          <div className="flex gap-2">
            <CsvImportDialog funds={allFunds} />
            <TradeFormDialog funds={fundsForForm} />
          </div>
        </div>

        <TradeFilters
          funds={data.filterOptions.funds}
          symbols={data.filterOptions.symbols}
        />

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span>{winLossText}</span>
          <span
            className={cn(
              "tabular-nums",
              totals.netPnl > 0 && "text-profit",
              totals.netPnl < 0 && "text-loss",
            )}
          >
            {formatCurrency(totals.netPnl, { signed: true })} net
          </span>
        </div>

        <TradesTable
          trades={data.trades}
          totalCount={data.totalCount}
          page={filter.page ?? 1}
          pageSize={TRADES_PAGE_SIZE}
        />
      </main>
      <TradeDrawer trade={selectedTrade} funds={fundsForForm} />
    </div>
  );
}
