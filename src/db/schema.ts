import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const funds = sqliteTable("funds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firm: text("firm"),
  accountSize: real("account_size").notNull(),
  maxDrawdown: real("max_drawdown"),
  profitTarget: real("profit_target"),
  status: text("status", {
    enum: ["evaluation", "funded", "passed", "blown", "archived"],
  })
    .notNull()
    .default("evaluation"),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const trades = sqliteTable(
  "trades",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id")
      .notNull()
      .references(() => funds.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    side: text("side", { enum: ["long", "short"] }).notNull(),
    qty: integer("qty").notNull(),
    entryPrice: real("entry_price").notNull(),
    exitPrice: real("exit_price"),
    entryAt: integer("entry_at", { mode: "timestamp_ms" }).notNull(),
    exitAt: integer("exit_at", { mode: "timestamp_ms" }),
    pnl: real("pnl"),
    commission: real("commission").notNull().default(0),
    pnlHigh: real("pnl_high"),
    pnlLow: real("pnl_low"),
    winDurationSec: integer("win_duration_sec"),
    lossDurationSec: integer("loss_duration_sec"),
    notes: text("notes"),
    screenshotUrl: text("screenshot_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("idx_trades_fund_entry").on(table.fundId, table.entryAt),
    index("idx_trades_entry_at").on(table.entryAt),
  ],
);

export const fundEvents = sqliteTable(
  "fund_events",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id")
      .notNull()
      .references(() => funds.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: [
        "eval_fee",
        "pa_fee",
        "combined_fee",
        "reset_fee",
        "activation_fee",
        "payout",
        "other_fee",
      ],
    }).notNull(),
    amount: real("amount").notNull(),
    occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("idx_fund_events_fund").on(table.fundId),
    index("idx_fund_events_type").on(table.type),
  ],
);

export const tradeTags = sqliteTable(
  "trade_tags",
  {
    tradeId: text("trade_id")
      .notNull()
      .references(() => trades.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tradeId, table.tag] }),
    index("idx_trade_tags_tag").on(table.tag),
  ],
);

export const dailyNotes = sqliteTable(
  "daily_notes",
  {
    id: text("id").primaryKey(),
    fundId: text("fund_id").references(() => funds.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    minBalance: real("min_balance"),
    maxBalance: real("max_balance"),
    marketRegime: text("market_regime"),
    generalNotes: text("general_notes"),
    mood: text("mood"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [index("idx_daily_notes_date").on(table.date)],
);

export const economicEvents = sqliteTable(
  "economic_events",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    time: text("time"),
    currency: text("currency").notNull(),
    title: text("title").notNull(),
    impact: text("impact", { enum: ["high", "medium", "low"] }).notNull(),
    forecast: text("forecast"),
    previous: text("previous"),
    actual: text("actual"),
    source: text("source"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("idx_econ_events_date").on(table.date),
    index("idx_econ_events_impact").on(table.impact),
  ],
);

export const tradeEventLinks = sqliteTable(
  "trade_event_links",
  {
    tradeId: text("trade_id")
      .notNull()
      .references(() => trades.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => economicEvents.id, { onDelete: "cascade" }),
    proximityMin: integer("proximity_min"),
  },
  (table) => [primaryKey({ columns: [table.tradeId, table.eventId] })],
);

export type Fund = typeof funds.$inferSelect;
export type NewFund = typeof funds.$inferInsert;
export type FundEvent = typeof fundEvents.$inferSelect;
export type NewFundEvent = typeof fundEvents.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type DailyNote = typeof dailyNotes.$inferSelect;
export type EconomicEvent = typeof economicEvents.$inferSelect;
