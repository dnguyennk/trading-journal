"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TradeWithFund } from "@/lib/trades/types";

export function TradesTable({
  trades,
  totalCount,
  page,
  pageSize,
}: {
  trades: TradeWithFund[];
  totalCount: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        No trades match these filters.
      </div>
    );
  }

  function buildHref(extra: Record<string, string>): string {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(extra)) sp.set(k, v);
    return `/trades?${sp.toString()}`;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead>Fund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((t) => (
              <TableRow
                key={t.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() =>
                  router.push(buildHref({ selected: t.id }), { scroll: false })
                }
              >
                <TableCell className="whitespace-nowrap">
                  {format(new Date(t.entryAt), "MMM d")}
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {t.symbol}
                </TableCell>
                <TableCell className="font-mono text-xs uppercase">
                  {t.side}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t.qty}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {formatCurrency(t.entryPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums whitespace-nowrap">
                  {t.exitPrice != null ? formatCurrency(t.exitPrice) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums whitespace-nowrap",
                    t.pnl != null && t.pnl > 0 && "text-profit",
                    t.pnl != null && t.pnl < 0 && "text-loss",
                  )}
                >
                  {t.pnl != null
                    ? formatCurrency(t.pnl, { signed: true })
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                  {t.fundName}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (extra: Record<string, string>) => string;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <PageLink
          href={buildHref({ page: String(prev) })}
          disabled={page <= 1}
        >
          ← Prev
        </PageLink>
        <PageLink
          href={buildHref({ page: String(next) })}
          disabled={page >= totalPages}
        >
          Next →
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="rounded border px-3 py-1 opacity-40">{children}</span>
    );
  }
  return (
    <Link
      href={href}
      scroll={false}
      className="rounded border px-3 py-1 hover:bg-muted/40"
    >
      {children}
    </Link>
  );
}
