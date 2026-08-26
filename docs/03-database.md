# 03 — Database

## Overview

- **SQLite** file at `data/trading-journal.db` (overridable via the `DATABASE_URL` env var). The `data/` directory is **gitignored** — back it up manually if you care about the data.
- Connection: `src/db/index.ts` — `better-sqlite3` sync API, enables `journal_mode = WAL` + `foreign_keys = ON`.
- The schema is defined in **`src/db/schema.ts`** (Drizzle, SQLite dialect). Types used across the app (`Fund`, `Trade`, `FundEvent`…) are `$inferSelect` results from here.
- Generated migration files live in `drizzle/*.sql` (currently 4: `0000` → `0003`).

## ERD — 7 tables

```mermaid
erDiagram
    FUNDS ||--o{ TRADES : "fund_id (cascade delete)"
    FUNDS ||--o{ FUND_EVENTS : "fund_id (cascade delete)"
    FUNDS ||--o{ DAILY_NOTES : "fund_id nullable (cascade)"
    TRADES ||--o{ TRADE_TAGS : "trade_id (cascade)"
    ECONOMIC_EVENTS ||--o{ TRADE_EVENT_LINKS : "event_id (cascade)"
    TRADES ||--o{ TRADE_EVENT_LINKS : "trade_id (cascade)"

    FUNDS {
        text id PK "uuid"
        text name "fund name, unique by convention"
        text firm "Apex / TopStep / Lucid..."
        real account_size "e.g. 50000"
        real max_drawdown
        real profit_target
        text status "evaluation|funded|passed|blown|archived"
        integer started_at "timestamp_ms"
        text notes
        text nt_account "maps to Account in NT CSV"
    }
    TRADES {
        text id PK "uuid"
        text fund_id FK
        text symbol "e.g. MNQ 12-25"
        text side "long|short"
        integer qty
        real entry_price "weighted avg on import"
        real exit_price
        integer entry_at "timestamp_ms"
        integer exit_at "null = not closed yet"
        real pnl "NET of commission"
        real commission
        real pnl_high "peak excursion"
        real pnl_low "trough excursion"
        text import_id "dedup: unique (fund_id, import_id)"
    }
    FUND_EVENTS {
        text id PK
        text fund_id FK
        text type "6 fee types + payout"
        real amount
        integer occurred_at "timestamp_ms"
        text note
    }
    TRADE_TAGS {
        text trade_id PK "composite PK"
        text tag PK "composite PK"
    }
    DAILY_NOTES {
        text id PK
        text fund_id FK "null = note shared for that day"
        text date "YYYY-MM-DD"
        real min_balance
        real max_balance
        text market_regime "fixed enum"
        text general_notes
        text mood "fixed enum"
    }
    ECONOMIC_EVENTS {
        text id PK
        text date "YYYY-MM-DD"
        text time
        text currency
        text title
        text impact "high|medium|low"
    }
    TRADE_EVENT_LINKS {
        text trade_id PK "composite PK"
        text event_id PK "composite PK"
        integer proximity_min "minutes between trade and event"
    }
```

## Table-by-table details

### `funds` — a prop firm account

- `status` describes the prop account lifecycle: `evaluation` → `funded` (PA) → `passed` / `blown` → `archived`.
- **`archived` has special semantics**: archived funds still **count toward fees/payouts** (real money spent/received) but are **excluded from trade P&L** (treated as sim). See [04-pages.md](04-pages.md).
- `nt_account` is the bridge for CSV imports: the server matches the NinjaTrader `Account` column against this field.

### `trades` — one position, open or closed

- `pnl` is **net of commission**. An open trade has `exitAt IS NULL` and is excluded from all statistics.
- `importId` = the **smallest** fill ID among the fills paired into that trade; used for dedup on re-import (partial unique index — only applies when `import_id IS NOT NULL`, so manual trades are unconstrained).
- Indexes: `(fund_id, entry_at)`, `(entry_at)`, unique `(fund_id, import_id)`.

### `fund_events` — fee & payout cash flow

| `type` | Meaning | Side |
|---|---|---|
| `eval_fee` | Buying an evaluation account | out |
| `pa_fee` / `activation_fee` / `combined_fee` | Fees to get funded | out |
| `reset_fee` | Resetting a blown account | out |
| `other_fee` | Anything else | out |
| `payout` | Withdrawn money | in |

`amount` is always positive; in/out is determined by `type`. This list is also the source of `FUND_EVENT_TYPES` in `src/lib/funds/types.ts`.

### `daily_notes` — daily journal

- `fundId = NULL` means the note is **shared** for that date (how the day-detail feature currently uses it); unique index on `(date, fund_id)`.
- `mood` + `market_regime` are **fixed enums** defined in `src/lib/daily-notes/enums.ts`.

### `economic_events` + `trade_event_links` — foundation of the killer feature

Not used by the UI yet. Roadmap goal: *"when a similar FOMC/NFP event happens again → show every trade around such events in the past, win/loss, and why"*. `proximity_min` stores the minute-distance between a trade and an event to filter for "near event".

## Migration workflow

```mermaid
flowchart TD
    A["Edit src/db/schema.ts"] --> B["npm run db:generate"]
    B --> C["drizzle-kit generates<br/>drizzle/00XX_*.sql"]
    C --> D["Review the SQL diff (git)"]
    D --> E["npm run db:migrate<br/>tsx src/db/migrate.ts"]
    E --> F[("data/trading-journal.db<br/>schema updated")]
    F --> G["Commit schema.ts + SQL file together"]
    G --> H["Other devs pull<br/>then just npm run db:migrate"]
```

- **`db:push`** = pushes the schema straight into the DB **without** generating a migration — experimentation only, never for real changes.
- **`db:studio`** = opens Drizzle Studio (a GUI to inspect/edit data) — handy for debugging.
- **Never hand-edit** files in `drizzle/` or modify the DB directly while working on a feature.
- Rule of thumb: a schema change ⇒ its migration ships in the same commit, so any other machine just needs `db:migrate` to work.

---

[← 02 Architecture](02-architecture.md) · [Index](README.md) · [Next: Pages →](04-pages.md)
