-- Normally applied automatically before the backend starts listening.
-- Run once on an older application database only if Lab.Timezone is missing
-- and the application account cannot add columns. Use a database admin account.
ALTER TABLE `Lab` ADD COLUMN `Timezone` VARCHAR(45) NULL DEFAULT '';
-- An empty value inherits the general timezone; existing lab data is unchanged.
