import { AppHeader } from "@/components/app-header";
import { AccountsList } from "@/components/funds/accounts-list";
import { ChartsGrid } from "@/components/funds/charts/charts-grid";
import { HeadlineTotals } from "@/components/funds/charts/headline-totals";
import { FirmRollupCards } from "@/components/funds/firm-rollup-cards";
import { FundDrawer } from "@/components/funds/fund-drawer";
import { FundFormDialog } from "@/components/funds/fund-form-dialog";
import {
  deriveByFirm,
  deriveCumulativePnl,
  derivePayoutTimeline,
  deriveTotals,
} from "@/lib/funds/derive";
import { getFundsPageData } from "@/lib/funds/queries";

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const sp = await searchParams;
  const { funds, events } = await getFundsPageData();

  const totals = deriveTotals(funds);
  const firms = deriveByFirm(funds);
  const cumulative = deriveCumulativePnl(events, funds);
  const payouts = derivePayoutTimeline(events, funds);
  const activeFundCount = funds.filter((f) => f.status !== "archived").length;

  const selectedFund = sp.selected
    ? (funds.find((f) => f.id === sp.selected) ?? null)
    : null;
  const selectedEvents = selectedFund
    ? events.filter((e) => e.fundId === selectedFund.id)
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-350 flex-1 space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Funds
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track every prop firm account — fees, payouts, and ROI.
            </p>
          </div>
          <FundFormDialog triggerLabel="+ New Fund" title="New Fund" />
        </div>

        {funds.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <HeadlineTotals
              totals={totals}
              activeFundCount={activeFundCount}
            />
            <ChartsGrid
              firms={firms}
              totals={totals}
              cumulative={cumulative}
              payouts={payouts}
            />
            <FirmRollupCards firms={firms} />
            <AccountsList funds={funds} />
          </>
        )}
      </main>
      <FundDrawer fund={selectedFund} events={selectedEvents} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
      <p className="font-serif text-xl">No funds yet</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Create your first fund to start tracking fees, payouts, and ROI.
      </p>
      <FundFormDialog
        triggerLabel="+ Create your first fund"
        triggerSize="sm"
        triggerClassName="mt-4"
        title="New Fund"
      />
    </div>
  );
}
