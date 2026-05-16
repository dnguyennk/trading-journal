import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDuration, formatPercent } from "@/lib/format";

export type TradeRow = {
  id: string;
  date: string;
  fundName: string;
  symbol: string;
  netPnl: number;
  pnlHigh: number | null;
  pnlLow: number | null;
  qty: number;
  commission: number;
  avgWin: number | null;
  avgLoss: number | null;
  winDurationSec: number | null;
  lossDurationSec: number | null;
  winPct: number;
};

type Props = {
  rows: TradeRow[];
  hideFundColumn?: boolean;
};

export function TradeHistoryTable({ rows, hideFundColumn = false }: Props) {
  const colSpan = hideFundColumn ? 12 : 13;
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-primary/15 px-6 py-4">
        <h2 className="font-serif text-lg font-semibold tracking-tight">
          Trading History
        </h2>
        <Badge
          variant="outline"
          className="rounded-full border-primary/30 bg-primary/10 px-3 font-mono text-[10px] uppercase tracking-wider text-primary"
        >
          {rows.length} record{rows.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</TableHead>
              {!hideFundColumn && (
                <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Fund</TableHead>
              )}
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Net PNL</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">PNL High</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">PNL Low</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Qty</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Commission</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Win</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Loss</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Win Duration</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Loss Duration</TableHead>
              <TableHead className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">Win %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colSpan}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  Chưa có trade nào — log trade đầu tiên để bắt đầu.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} className="text-sm">
                  <TableCell>{r.date}</TableCell>
                  {!hideFundColumn && (
                    <TableCell className="text-muted-foreground">{r.fundName}</TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-md border-primary/30 bg-primary/10 font-mono text-xs text-primary"
                    >
                      {r.symbol}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-semibold tabular-nums",
                      r.netPnl > 0 && "text-profit",
                      r.netPnl < 0 && "text-loss",
                    )}
                  >
                    {formatCurrency(r.netPnl, { signed: true })}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.pnlHigh != null ? formatCurrency(r.pnlHigh) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.pnlLow != null ? formatCurrency(r.pnlLow) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.qty}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(r.commission)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.avgWin != null ? formatCurrency(r.avgWin) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.avgLoss != null ? formatCurrency(r.avgLoss) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(r.winDurationSec)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(r.lossDurationSec)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md font-mono text-xs",
                        r.winPct >= 0.5
                          ? "border-profit/40 bg-profit/10 text-profit"
                          : "border-loss/40 bg-loss/10 text-loss",
                      )}
                    >
                      {formatPercent(r.winPct)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
