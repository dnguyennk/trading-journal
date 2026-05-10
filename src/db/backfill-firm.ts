import { eq, isNull, or } from "drizzle-orm";
import { db } from "./index";
import { funds } from "./schema";
import { detectAccount } from "../lib/trades/account-patterns";

// One-shot backfill: populate `firm` for funds where it is null/empty.
// Uses detectAccount() to derive firm from ntAccount (regex prefix match).
//
// Idempotent: skips funds that already have a firm set.
// Safe to re-run after future imports introduce more nulls (rare; should not
// happen once the bulkImport fix lands, but kept idempotent for safety).
//
// Run with: pnpm tsx src/db/backfill-firm.ts
//
// Connection is unknown for existing fund rows (we never persisted it), so
// `detectAccount(ntAccount, null)` only succeeds for accounts whose firm is
// inferable from the ntAccount prefix alone (LFE/LFF/TDFYSL/FNFT/Sim).
// Apex/Topstep accounts whose firm came from CSV Connection column will not
// be backfilled here — they are logged as warnings and need manual edit.

async function main() {
  // Find candidates: firm IS NULL OR firm = '' AND ntAccount IS NOT NULL.
  const candidates = await db
    .select({ id: funds.id, name: funds.name, ntAccount: funds.ntAccount })
    .from(funds)
    .where(or(isNull(funds.firm), eq(funds.firm, "")));

  console.log(`Found ${candidates.length} funds with empty firm.`);

  let updated = 0;
  let skipped = 0;

  for (const f of candidates) {
    if (!f.ntAccount) {
      console.warn(`  [skip] ${f.name}: no ntAccount, cannot detect firm`);
      skipped++;
      continue;
    }

    const detection = detectAccount(f.ntAccount, null);
    if (!detection || !detection.firm) {
      console.warn(`  [skip] ${f.name} (${f.ntAccount}): no firm match`);
      skipped++;
      continue;
    }
    await db.update(funds).set({ firm: detection.firm }).where(eq(funds.id, f.id));
    console.log(`  [ok] ${f.name} → ${detection.firm}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}. Skipped: ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
