CREATE TABLE `fund_events` (
	`id` text PRIMARY KEY NOT NULL,
	`fund_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`occurred_at` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_fund_events_fund` ON `fund_events` (`fund_id`);--> statement-breakpoint
CREATE INDEX `idx_fund_events_type` ON `fund_events` (`type`);