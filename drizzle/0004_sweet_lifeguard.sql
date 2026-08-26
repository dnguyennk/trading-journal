-- The unique index was already hand-applied in 0003 on existing dev DBs;
-- IF NOT EXISTS keeps this idempotent on both fresh and existing databases.
CREATE UNIQUE INDEX IF NOT EXISTS `idx_daily_notes_date_fund` ON `daily_notes` (`date`,COALESCE(`fund_id`, ''));
