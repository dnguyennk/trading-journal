import type {
  CumulativePoint,
  FirmRollup,
  FundStats,
  PayoutPoint,
} from "@/lib/funds/types";
import { CumulativePnlChart } from "./cumulative-pnl-chart";
import { CumulativeTradePnlChart } from "./cumulative-trade-pnl-chart";
import { PayoutTimelineChart } from "./payout-timeline-chart";
import { RoiCompareChart } from "./roi-compare-chart";
import { SpendVsEarnChart } from "./spend-vs-earn-chart";
import { StatusDonutChart } from "./status-donut-chart";

export function ChartsGrid({
  firms,
  totals,
  cumulative,
  cumulativeTrade,
  payouts,
}: {
  firms: FirmRollup[];
  totals: FundStats;
  cumulative: CumulativePoint[];
  cumulativeTrade: CumulativePoint[];
  payouts: PayoutPoint[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CumulativePnlChart points={cumulative} />
      <CumulativeTradePnlChart points={cumulativeTrade} />
      <SpendVsEarnChart firms={firms} />
      <RoiCompareChart firms={firms} totals={totals} />
      <StatusDonutChart firms={firms} />
      <PayoutTimelineChart points={payouts} />
    </div>
  );
}
