import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { FundFilter } from "@/components/fund-filter";
import { StatsCards } from "@/components/stats-cards";
import { TradeHistoryTable } from "@/components/trade-history-table";
import { TradingCalendar } from "@/components/trading-calendar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard/queries";
import { deriveCalendarPnl } from "@/lib/dashboard/derive-calendar";
import { deriveStats } from "@/lib/dashboard/derive-stats";
import { deriveTradeRows } from "@/lib/dashboard/derive-table";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ fund?: string }>;
}) {
  const sp = await searchParams;
  const fundId = sp.fund;
  const { funds, activeFunds, trades } = await getDashboardData(fundId);

  if (funds.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-350 flex-1 px-6 py-8">
          <EmptyState
            title="No funds yet"
            body="Create your first prop firm account to start tracking."
            ctaHref="/funds"
            ctaLabel="Go to Funds"
          />
        </main>
      </div>
    );
  }

  const selectedFund = fundId ? funds.find((f) => f.id === fundId) : null;
  const fundIsArchived = selectedFund?.status === "archived";

  if (fundId && !selectedFund) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-350 flex-1 px-6 py-8">
          <EmptyState
            title="Fund not found"
            body={`No fund with id "${fundId}". It may have been deleted.`}
            ctaHref="/"
            ctaLabel="View all funds"
          />
        </main>
      </div>
    );
  }

  const stats = deriveStats(trades);
  const pnlByDate = deriveCalendarPnl(trades);
  const rows = deriveTradeRows(trades, funds, 50);

  const latest = trades[0]?.exitAt;
  const initialMonth = latest
    ? new Date(latest.getFullYear(), latest.getMonth(), 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const badgeLabel = `${MONTHS[initialMonth.getMonth()]} ${initialMonth.getFullYear()}`;

  const subtitle = selectedFund
    ? `${selectedFund.name} · ${Math.round(selectedFund.accountSize / 1000)}K account`
    : "All funds · aggregate view";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-350 flex-1 space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="mb-3 rounded-full border-primary/30 bg-primary/10 font-mono text-[10px] uppercase tracking-[0.2em] text-primary"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {badgeLabel}
            </Badge>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <FundFilter
            funds={funds}
            activeFunds={activeFunds}
            selectedId={fundId}
          />
        </div>

        {fundIsArchived && (
          <Card className="flex items-center gap-3 border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>This fund is archived. Showing historical data only.</span>
          </Card>
        )}

        {trades.length === 0 ? (
          <EmptyState
            title="No trades yet"
            body={
              selectedFund
                ? `No trades logged for ${selectedFund.name}. Import or log a trade to begin.`
                : "Import a NinjaTrader CSV or log a trade manually to populate this dashboard."
            }
            ctaHref="/trades"
            ctaLabel="Go to Trades"
          />
        ) : (
          <>
            <StatsCards {...stats} />
            <TradingCalendar
              pnlByDate={pnlByDate}
              eventsByDate={{}}
              initialMonth={initialMonth}
            />
            <TradeHistoryTable rows={rows} hideFundColumn={!!selectedFund} />
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      <Link
        href={ctaHref}
        className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/15"
      >
        {ctaLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </Card>
  );
}
