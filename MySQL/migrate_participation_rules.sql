-- Normally applied automatically before the server starts listening.
-- Run only on older databases without this column.
ALTER TABLE `Study` ADD COLUMN `ParticipationRules` JSON NULL;
-- NULL preserves legacy prerequisites (ANY) and exclusions (NONE).
-- [] explicitly removes all participation requirements.
