CREATE UNIQUE INDEX `idx_daily_notes_date_fund` ON `daily_notes` (`date`,COALESCE(`fund_id`, ''));
