import { Activity, Flame, Percent, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

type Props = {
  netPnl: number;
  winRate: number;
  totalTrades: number;
  bestStreak: number;
};

export function StatsCards({ netPnl, winRate, totalTrades, bestStreak }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Net PNL"
        value={formatCurrency(netPnl, { signed: true })}
        icon={<TrendingUp className="h-4 w-4" />}
        accent={netPnl >= 0 ? "profit" : "loss"}
        sub="all trades"
      />
      <StatCard
        label="Win Rate"
        value={formatPercent(winRate)}
        icon={<Percent className="h-4 w-4" />}
        accent="primary"
        sub="all trades"
      />
      <StatCard
        label="Total Trades"
        value={totalTrades.toString()}
        icon={<Activity className="h-4 w-4" />}
        sub="logged"
      />
      <StatCard
        label="Best Streak"
        value={`${bestStreak}W`}
        icon={<Flame className="h-4 w-4" />}
        accent="primary"
        sub="consecutive wins"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "profit" | "loss" | "primary";
  sub?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 transition-colors",
        "before:absolute before:left-0 before:top-0 before:h-full before:w-0.5",
        accent === "primary" && "before:bg-primary/60",
        accent === "profit" && "before:bg-profit/70",
        accent === "loss" && "before:bg-loss/70",
        !accent && "before:bg-border/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border",
            accent === "primary" &&
              "border-primary/30 bg-primary/10 text-primary",
            accent === "profit" &&
              "border-profit/30 bg-profit/10 text-profit",
            accent === "loss" && "border-loss/30 bg-loss/10 text-loss",
            !accent && "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {icon}
        </span>
      </div>
      <div
        className={cn(
          "mt-3 font-serif text-3xl font-semibold tracking-tight tabular-nums",
          accent === "profit" && "text-profit",
          accent === "loss" && "text-loss",
          accent === "primary" && "text-foreground",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {sub}
        </div>
      )}
    </Card>
  );
}
