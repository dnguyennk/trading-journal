import type { Fill, PairedTrade, PairingResult } from "./types";
import { multiplierFor } from "./symbol-multipliers";

function groupBy<T, K>(items: T[], keyFn: (x: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = keyFn(item);
    const list = out.get(k) ?? [];
    list.push(item);
    out.set(k, list);
  }
  return out;
}

function weightedAvg(fills: Fill[]): number {
  const totalQty = fills.reduce((s, f) => s + f.qty, 0);
  if (totalQty === 0) return 0;
  return fills.reduce((s, f) => s + f.price * f.qty, 0) / totalQty;
}

function buildTrade(
  openings: Fill[],
  closings: Fill[],
  side: "long" | "short",
): PairedTrade {
  const totalQty = openings.reduce((s, f) => s + f.qty, 0);
  const entryPrice = weightedAvg(openings);
  const exitPrice = weightedAvg(closings);
  const symbol = openings[0].symbol;
  const mult = multiplierFor(symbol);
  const grossPnl =
    side === "long"
      ? (exitPrice - entryPrice) * totalQty * mult
      : (entryPrice - exitPrice) * totalQty * mult;
  const commission = [...openings, ...closings].reduce(
    (s, f) => s + f.commission,
    0,
  );
  const allIds = [...openings, ...closings].map((f) => f.id).sort();
  return {
    importId: allIds[0],
    symbol,
    side,
    qty: totalQty,
    entryPrice,
    exitPrice,
    entryAt: openings[0].time,
    exitAt: closings[closings.length - 1].time,
    pnl: grossPnl - commission,
    commission,
    account: openings[0].account,
    fillIds: allIds,
  };
}

export function pairFillsIntoTrades(fills: Fill[]): PairingResult {
  const groups = groupBy(fills, (f) => `${f.account}|${f.symbol}`);
  const trades: PairedTrade[] = [];
  const openPositions: Fill[] = [];

  for (const [, groupFills] of groups) {
    const sorted = [...groupFills].sort(
      (a, b) => a.time.getTime() - b.time.getTime(),
    );
    let position = 0;
    let openingFills: Fill[] = [];
    let closingFills: Fill[] = [];
    let openSide: "long" | "short" | null = null;
    let fromFlip = false;

    for (const fill of sorted) {
      const signedQty = fill.action === "Buy" ? fill.qty : -fill.qty;

      if (position === 0) {
        // Opening a new trade
        openSide = signedQty > 0 ? "long" : "short";
        openingFills = [fill];
        closingFills = [];
        position = signedQty;
        fromFlip = false;
        continue;
      }

      const sameDirection = Math.sign(signedQty) === Math.sign(position);
      if (sameDirection) {
        // Scale-in
        openingFills.push(fill);
        position += signedQty;
        continue;
      }

      // Opposite direction
      const closingMagnitude = Math.abs(position);
      if (fill.qty <= closingMagnitude) {
        // Scale-out or full close
        closingFills.push(fill);
        position += signedQty;
        if (position === 0) {
          trades.push(buildTrade(openingFills, closingFills, openSide!));
          openingFills = [];
          closingFills = [];
          openSide = null;
          fromFlip = false;
        }
      } else {
        // Position flip: split fill into closing portion + new opening portion
        const closingPart: Fill = { ...fill, qty: closingMagnitude };
        const openingPart: Fill = {
          ...fill,
          qty: fill.qty - closingMagnitude,
        };
        closingFills.push(closingPart);
        trades.push(buildTrade(openingFills, closingFills, openSide!));
        // Start new trade from the remainder
        openSide = signedQty > 0 ? "long" : "short";
        openingFills = [openingPart];
        closingFills = [];
        position = signedQty + position; // flips sign
        fromFlip = true;
      }
    }

    if (position !== 0) {
      if (fromFlip) {
        // Emit the flipped-open position as an open trade (entry only, exit = entry)
        const entryPrice = weightedAvg(openingFills);
        const symbol = openingFills[0].symbol;
        const commission = openingFills.reduce((s, f) => s + f.commission, 0);
        const allIds = openingFills.map((f) => f.id).sort();
        trades.push({
          importId: allIds[0],
          symbol,
          side: openSide!,
          qty: openingFills.reduce((s, f) => s + f.qty, 0),
          entryPrice,
          exitPrice: entryPrice,
          entryAt: openingFills[0].time,
          exitAt: openingFills[0].time,
          pnl: -commission,
          commission,
          account: openingFills[0].account,
          fillIds: allIds,
        });
      }
      // Open position fills remain unmatched
      openPositions.push(...openingFills, ...closingFills);
    }
  }

  return { trades, openPositions };
}
