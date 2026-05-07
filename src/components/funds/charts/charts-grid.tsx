import type {
  CumulativePoint,
  FirmRollup,
  FundStats,
  PayoutPoint,
} from "@/lib/funds/types";
import { CumulativePnlChart } from "./cumulative-pnl-chart";
import { PayoutTimelineChart } from "./payout-timeline-chart";
import { RoiCompareChart } from "./roi-compare-chart";
import { SpendVsEarnChart } from "./spend-vs-earn-chart";
import { StatusDonutChart } from "./status-donut-chart";

export function ChartsGrid({
  firms,
  totals,
  cumulative,
  payouts,
}: {
  firms: FirmRollup[];
  totals: FundStats;
  cumulative: CumulativePoint[];
  payouts: PayoutPoint[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SpendVsEarnChart firms={firms} />
      <CumulativePnlChart points={cumulative} />
      <StatusDonutChart firms={firms} />
      <RoiCompareChart firms={firms} totals={totals} />
      <div className="md:col-span-2">
        <PayoutTimelineChart points={payouts} />
      </div>
    </div>
  );
}
