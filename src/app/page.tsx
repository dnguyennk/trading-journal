import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { StatsCards } from "@/components/stats-cards";
import { TradeHistoryTable } from "@/components/trade-history-table";
import { TradingCalendar } from "@/components/trading-calendar";
import { Badge } from "@/components/ui/badge";
import {
  demoEventsByDate,
  demoPnlByDate,
  demoStats,
  demoTrades,
} from "@/lib/demo-data";

export default function Home() {
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
              April 2026
            </Badge>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Apex 50K · MNQ futures · review your edge & habits.
            </p>
          </div>
        </div>

        <StatsCards {...demoStats} />

        <TradingCalendar
          pnlByDate={demoPnlByDate}
          eventsByDate={demoEventsByDate}
          initialMonth={new Date(2026, 3, 1)}
        />

        <TradeHistoryTable rows={demoTrades} />
      </main>
    </div>
  );
}
