ALTER TABLE `funds` ADD `nt_account` text;--> statement-breakpoint
ALTER TABLE `trades` ADD `import_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_trades_fund_import_id` ON `trades` (`fund_id`,`import_id`) WHERE "trades"."import_id" IS NOT NULL;