import { db } from "./index";
import { funds, fundEvents } from "./schema";

// Dev-only seed for /funds page. Idempotent: wipes existing funds + events first.
// Run with: pnpm db:seed
async function main() {
  await db.delete(fundEvents);
  await db.delete(funds);

  const fundId = crypto.randomUUID();
  await db.insert(funds).values({
    id: fundId,
    name: "Apex 50K #1",
    firm: "Apex",
    accountSize: 50000,
    maxDrawdown: 2500,
    profitTarget: 3000,
    status: "evaluation",
    startedAt: new Date("2026-04-01"),
    notes: "First eval account, MNQ only",
  });

  await db.insert(fundEvents).values([
    { id: crypto.randomUUID(), fundId, type: "eval_fee", amount: 147, occurredAt: new Date("2026-04-01"), note: "April promo" },
    { id: crypto.randomUUID(), fundId, type: "pa_fee", amount: 130, occurredAt: new Date("2026-04-15"), note: "Activation after pass" },
    { id: crypto.randomUUID(), fundId, type: "payout", amount: 1500, occurredAt: new Date("2026-04-25"), note: "First payout" },
  ]);

  const fundId2 = crypto.randomUUID();
  await db.insert(funds).values({
    id: fundId2,
    name: "Tradeify 100K",
    firm: "Tradeify",
    accountSize: 100000,
    maxDrawdown: 3500,
    profitTarget: 6000,
    status: "evaluation",
    startedAt: new Date("2026-04-20"),
    notes: null,
  });

  await db.insert(fundEvents).values([
    { id: crypto.randomUUID(), fundId: fundId2, type: "eval_fee", amount: 199, occurredAt: new Date("2026-04-20"), note: null },
    { id: crypto.randomUUID(), fundId: fundId2, type: "reset_fee", amount: 89, occurredAt: new Date("2026-04-28"), note: "Hit DD limit" },
  ]);

  console.log("Seeded:", fundId, fundId2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
