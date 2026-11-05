-- Optional custom subject for the eligible-family (Introduction) email.
-- The backend adds this column automatically on startup; run this only if that fails
-- (for example, the database user lacks ALTER permission).
ALTER TABLE `Study` ADD COLUMN `IntroductionEmailSubject` VARCHAR(255) NULL;
