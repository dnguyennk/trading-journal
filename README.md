# Trading Journal

A self-hosted trade journal web app for futures prop-firm traders. Tracks multiple funded/evaluation accounts, fees, payouts, ROI, and per-trade P&L from NinjaTrader CSV exports or manual entry.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**, **Tailwind CSS v4**
- **Drizzle ORM** + **better-sqlite3** (local file DB under `data/`)
- **@base-ui/react** (shadcn components ported to Base UI, not Radix)
- **Recharts** for charts, **react-hook-form** + **Zod** for forms
- **Vitest** for unit tests

## Getting started

```bash
# install
npm install

# generate + apply DB migrations (creates data/journal.db)
npm run db:generate
npm run db:migrate

# optional: seed with sample data
npm run db:seed

# run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Generate Drizzle migrations from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `data/journal.db` |
| `npm run db:push` | Push schema without migration (dev only) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed sample data |

## Project structure

```
src/
├── app/                  # Next.js App Router routes
│   ├── funds/            # Accounts dashboard
│   └── trades/           # Trades list + import
├── components/
│   ├── funds/            # Fund cards, event forms, rollups
│   ├── trades/           # Trade table, drawer, CSV importer
│   └── ui/               # Base UI–backed shadcn primitives
├── db/
│   ├── schema.ts         # Drizzle schema (funds, trades, fundEvents, ...)
│   ├── migrate.ts
│   └── seed.ts
└── lib/
    ├── funds/            # Server actions, queries, P&L derivation
    └── trades/           # CSV parsing, fill pairing, account detection
data/                     # SQLite DB file (gitignored)
drizzle/                  # Generated migrations
```

## Features

### Accounts (`/funds`)
- Track multiple funded/evaluation accounts across prop firms (Apex, TopStep, Tradeify, MFFU, …)
- Per-account fee, payout, and event log (`eval_fee`, `pa_fee`, `reset_fee`, `activation_fee`, `payout`, `other_fee`)
- Auto-grouped rollups by firm with combined ROI / net P&L
- Inline rename, status badges, bulk-archive, danger zone
- Archived/blown accounts still count cash fees but are excluded from active trade P&L

### Trades (`/trades`)
- Manual trade entry with symbol multipliers and futures contract presets
- NinjaTrader CSV import with fill pairing (FIFO), duplicate detection via `(fundId, importId)` unique index
- Per-trade P&L, commission, peak/trough excursion, duration
- Filterable table, drawer with details, tagging

### Themes
- 15 themes grouped by mode in the header dropdown
  - **Dark (8):** `dark`, `bull`, `bear`, `focus`, `midnight-steel`, `tokyo-night`, `synthwave`, `catppuccin`
  - **Light (7):** `light`, `pastel-soft`, `newsprint`, `clinical`, `mint-fresh`, `violet-bloom`, `sunset-glow`
- Invariants preserved across themes: profit always green (hue 150), loss always red (hue 25)

## Data storage

SQLite file under `data/journal.db`. The `data/` directory is gitignored — back it up manually if you care about the data. Schema is defined in [src/db/schema.ts](src/db/schema.ts); migrations live in [drizzle/](drizzle/).

## Testing

```bash
npm run test
```

Current coverage focuses on trade-related logic (`src/lib/trades/`): CSV parsing, fill pairing, server actions, account-pattern detection. Fund derivation has basic coverage in [src/lib/funds/derive.test.ts](src/lib/funds/derive.test.ts).

## Notes

This repo uses Next.js 16 (App Router) with React 19 — some APIs differ from older Next.js docs you may find online. Refer to the version in `node_modules/next/dist/docs/` when in doubt.
