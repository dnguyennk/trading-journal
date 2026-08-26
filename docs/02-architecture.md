# 02 — Overall Architecture

## Core principles

1. **No intermediate API layer.** No REST, no tRPC, no client-side `fetch` to `/api/...`. Server Components read the DB directly while rendering; Server Actions write to the DB directly on form submit.
2. **Business logic lives in pure functions** under `src/lib/` — no React/DB dependencies → easy to unit test. Components only render.
3. **The URL is the state.** Filters, pagination, which drawer is open… all live in search params → SSR-friendly, shareable, back/forward works.

## Big picture

```mermaid
flowchart TB
    subgraph Browser["🖥️ Browser"]
        CC["Client Components<br/>'use client'<br/>forms, dialogs, filters,<br/>calendar, charts, drawer"]
    end

    subgraph Server["⚙️ Next.js Server (Node.js runtime)"]
        direction TB
        RSC["Server Components<br/>src/app/*/page.tsx<br/>fetch data + render HTML"]
        SA["Server Actions<br/>'use server' — src/lib/*/actions.ts<br/>validate (Zod) + write DB"]
        Q["Query functions<br/>src/lib/*/queries.ts<br/>read-only, use Drizzle"]
        L["Derive logic (pure)<br/>derive-stats, derive-calendar,<br/>derive-table, pair-fills… ← unit tested"]
    end

    subgraph DataLayer["💾 Data Layer"]
        ORM["Drizzle ORM<br/>src/db/index.ts + schema.ts"]
        DB[("SQLite<br/>data/trading-journal.db<br/>WAL + foreign_keys ON")]
        MIG["drizzle-kit<br/>drizzle/*.sql migrations"]
    end

    CC -- "submit FormData<br/>(useActionState)" --> SA
    SA -- "insert / update / delete" --> ORM
    RSC --> Q
    RSC --> L
    Q --> ORM
    ORM --> DB
    MIG --> DB
    SA -. "revalidatePath()" .-> RSC
```

## READ flow — rendering a page

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant B as Browser
    participant RSC as Page (Server Component)
    participant Q as queries.ts
    participant D as derive-*.ts (pure)
    participant DB as SQLite

    U->>B: Open /?fund=abc
    B->>RSC: GET /?fund=abc
    RSC->>RSC: await searchParams
    RSC->>Q: getDashboardData(fundId)
    Q->>DB: SELECT funds, trades, events
    DB-->>Q: rows
    Q-->>RSC: raw data
    RSC->>D: deriveStats / deriveCalendarPnl / deriveTradeRows
    D-->>RSC: computed data
    RSC-->>B: fully rendered HTML (SSR)
    Note over RSC,D: Client components (calendar, table) hydrate afterwards
```

## WRITE flow — submitting a form

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant F as Form (client)
    participant SA as Server Action<br/>e.g. saveTrade()
    participant Z as Zod schema
    participant DB as SQLite

    U->>F: fill in + submit
    F->>SA: FormData (useActionState)
    SA->>Z: safeParse(formData)
    alt validation fails
        Z-->>SA: fieldErrors
        SA-->>F: ok false + fieldErrors (shown per field)
    else validation passes
        SA->>DB: INSERT / UPDATE
        SA->>SA: revalidatePath("/trades", "/funds")
        SA-->>F: ok true + id
        Note over F: router refresh → RSC re-renders with new data
    end
```

**Form state pattern** — every form-backed server action returns a consistent shape:

```ts
type FormState = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]> };
```

## Current Server Actions

| File | Actions |
|---|---|
| `src/lib/trades/actions.ts` | `saveTrade`, `deleteTrade`, `bulkImport` (CSV) |
| `src/lib/funds/actions.ts` | `saveFund`, `renameFund`, `changeFundStatus`, `archiveFund`, `archiveFunds`, `deleteFund`, `createFundEvent`, `deleteFundEvent` |
| `src/lib/dashboard/day-detail.ts` | `getDayDetail` (read), `upsertDailyNote` (write) |

## Dependency rules (important when adding new code)

```mermaid
flowchart TD
    APP["src/app/*<br/>routes — orchestration only"] --> LIB
    APP --> COMP
    COMP["src/components/*<br/>UI rendering"] --> LIB2["src/lib/*<br/>(types + pure helpers only)"]
    LIB["src/lib/*/queries.ts + actions.ts"] --> DB["src/db"]
    LIB2 -.->|not allowed| DB
    DB --> SQLITE[("SQLite")]
    style LIB2 stroke-dasharray: 5 5
```

- `src/db/schema.ts` is the **single source of truth** for the data model — all shared types (`Fund`, `Trade`…) are exported from here via `$inferSelect`.
- Pure functions in `lib/` **never import `db`** (only `queries.ts` / `actions.ts` do) → testable without a database.
- Components never query the DB directly — they always receive data via props from a parent server component.

## Why no API routes?

- Single-user local app with no external consumers → a REST layer would be pure boilerplate.
- Server Actions + `revalidatePath` give you fresh data after writes for free, no manual client cache invalidation.
- If a mobile app / public API is ever needed, add route handlers then — the logic is already isolated in `lib/`, so you would only wrap it.

---

[← 01 Overview](01-overview.md) · [Index](README.md) · [Next: Database →](03-database.md)
