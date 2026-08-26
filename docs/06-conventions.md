# 06 — Conventions & Working Process

## Where should new code go?

```mermaid
flowchart TD
    Q1{"Adding what?"} -->|new route/URL| A["src/app/&lt;route&gt;/page.tsx<br/>server component, await searchParams"]
    Q1 -->|UI rendering| B["src/components/&lt;feature&gt;/&lt;name&gt;.tsx<br/>props only"]
    Q1 -->|computation logic| C{"Touches DB?"}
    C -->|no| D["src/lib/&lt;feature&gt;/&lt;name&gt;.ts<br/>pure function + .test.ts next to it"]
    C -->|read| E["src/lib/&lt;feature&gt;/queries.ts"]
    C -->|write| F["src/lib/&lt;feature&gt;/actions.ts<br/>'use server' + Zod + revalidatePath"]
    Q1 -->|data model change| G["src/db/schema.ts<br/>→ npm run db:generate → db:migrate"]
```

## Server vs Client components

| | Server Component (default) | Client Component (`"use client"`) |
|---|---|---|
| Use for | page.tsx, layouts, data fetching | forms, dialogs, drawers, calendar, charts, filters |
| Allowed to | `await` the DB via queries, async | `useState`, `useActionState`, event handlers |
| Gets data | queries it itself | **via props** from a parent server component |

## Server Action pattern (standardized in this repo)

```ts
// 1. "use server" at the top of the file
// 2. Zod schema + FormData → raw object (emptyToNull for empty inputs)
// 3. safeParse → on failure return { ok: false, fieldErrors }
// 4. Drizzle insert/update
// 5. revalidatePath every affected page
//    (e.g. saveTrade revalidates BOTH /trades AND /funds)
```

Return the form state (or throw for simple actions like `deleteTrade(id)`).

## Testing

- **Vitest**, node environment, includes `src/**/*.test.ts(x)`, alias `@` → `src`.
- Test files sit **next to the implementation** (`derive-stats.ts` + `derive-stats.test.ts`).
- Coverage focuses on **pure logic**: CSV parsing, FIFO pairing, derivations, session dates (DST!), account patterns. Components and the DB are not tested.
- Run: `npm run test` (run it before pushing).

## Theming — invariants

- Adding a theme = a new entry in `src/lib/themes.ts` + a CSS variables block in `globals.css`.
- **Mandatory**: profit green (hue 150), loss red — in every theme. Use the `text-profit` / `text-loss` classes; never hard-code colors.
- Dark default, `enableSystem = false` — intentional.

## Formatting & style

- Currency: `formatCurrency` (`src/lib/format.ts`) — always go through this helper, never hard-code `$`.
- Dates: `date-fns`; ET session/day helpers live in `src/lib/dashboard/session-date.ts` (don't roll your own timezone math).
- Tailwind: use design tokens (`text-muted-foreground`, `bg-primary/10`…), avoid raw colors.

## Git workflow (mandatory since Phase 1)

```mermaid
flowchart LR
    A["git checkout main<br/>git pull"] --> B["new branch<br/>feat/fix/chore/docs-..."]
    B --> C["commit (conventional,<br/>title ≤ 72 chars)"]
    C --> D["git push -u origin branch"]
    D --> E["gh pr create --base main"]
    E --> F["review / browser-test"]
    F --> G["gh pr merge --squash<br/>--delete-branch"]
    G --> A
```

- **Never commit directly to `main`** — not even for solo work.
- Keep PR bodies short: Summary bullets + Test plan checklist.
- Branch prefixes: `feat/` · `fix/` · `chore/` · `docs/`.

## Pre-PR checklist

1. `npm run lint` is clean.
2. `npm run test` passes.
3. `npm run build` succeeds (better-sqlite3 needs a native build — can be slow the first time).
4. New logic is a pure function with unit tests.
5. Touched the schema ⇒ migration generated + applied locally.
6. Browser-tested the feature's main flow.

---

[← 05 Business flows](05-flows.md) · [Index](README.md)
