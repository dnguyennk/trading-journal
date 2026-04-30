CREATE TABLE `daily_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text,
	`date` text NOT NULL,
	`min_balance` real,
	`max_balance` real,
	`market_regime` text,
	`general_notes` text,
	`mood` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_daily_notes_date` ON `daily_notes` (`date`);--> statement-breakpoint
CREATE TABLE `economic_events` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text,
	`currency` text NOT NULL,
	`title` text NOT NULL,
	`impact` text NOT NULL,
	`forecast` text,
	`previous` text,
	`actual` text,
	`source` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_econ_events_date` ON `economic_events` (`date`);--> statement-breakpoint
CREATE INDEX `idx_econ_events_impact` ON `economic_events` (`impact`);--> statement-breakpoint
CREATE TABLE `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`firm` text,
	`account_size` real NOT NULL,
	`max_drawdown` real,
	`profit_target` real,
	`status` text DEFAULT 'evaluation' NOT NULL,
	`started_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trade_event_links` (
	`trade_id` text NOT NULL,
	`event_id` text NOT NULL,
	`proximity_min` integer,
	PRIMARY KEY(`trade_id`, `event_id`),
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `economic_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trade_tags` (
	`trade_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`trade_id`, `tag`),
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_trade_tags_tag` ON `trade_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `trades` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text NOT NULL,
	`symbol` text NOT NULL,
	`side` text NOT NULL,
	`qty` integer NOT NULL,
	`entry_price` real NOT NULL,
	`exit_price` real,
	`entry_at` integer NOT NULL,
	`exit_at` integer,
	`pnl` real,
	`commission` real DEFAULT 0 NOT NULL,
	`pnl_high` real,
	`pnl_low` real,
	`win_duration_sec` integer,
	`loss_duration_sec` integer,
	`notes` text,
	`screenshot_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_trades_fund_entry` ON `trades` (`fund_id`,`entry_at`);--> statement-breakpoint
CREATE INDEX `idx_trades_entry_at` ON `trades` (`entry_at`);