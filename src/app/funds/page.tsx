import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { FundDetail } from "@/components/funds/fund-detail";
import { FundList } from "@/components/funds/fund-list";
import { FundFormDialog } from "@/components/funds/fund-form-dialog";
import { Button } from "@/components/ui/button";
import { getFundEvents, getFundsWithStats } from "@/lib/funds/queries";

export default async function FundsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const sp = await searchParams;
  const fundsWithStats = await getFundsWithStats();

  // Auto-select first fund if none selected
  if (!sp.selected && fundsWithStats.length > 0) {
    redirect(`/funds?selected=${fundsWithStats[0].id}`);
  }

  const selectedFund = fundsWithStats.find((f) => f.id === sp.selected);
  const events = selectedFund ? await getFundEvents(selectedFund.id) : [];

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
          <FundFormDialog
            trigger={<Button>+ New Fund</Button>}
            title="New Fund"
          />
        </div>

        {fundsWithStats.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <FundList
              funds={fundsWithStats}
              selectedId={selectedFund?.id ?? null}
            />
            {selectedFund ? (
              <FundDetail fund={selectedFund} events={events} />
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select a fund to see details.
              </div>
            )}
          </div>
        )}
      </main>
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
        trigger={
          <Button className="mt-4" size="sm">
            + Create your first fund
          </Button>
        }
        title="New Fund"
      />
    </div>
  );
}
