-- ============================================================
USE `DRDB`; -- IMPORTANT: Change this to your actual database name if different

-- Migration: Flat MinAge/MaxAge  →  StudyAgeGroup table
--
-- Run this BEFORE deploying the updated application code.
-- Steps:
--   1. Create the new StudyAgeGroup table (Sequelize sync will
--      also do this, but running it manually first is safer).
--   2. Seed StudyAgeGroup from the existing Study.MinAge /
--      Study.MaxAge values so no age data is lost.
--   3. Create the prerequisite / exclusion junction tables.
--
-- After verifying the migrated data, the MinAge and MaxAge
-- columns can be dropped from Study with the final ALTER TABLE
-- statements (commented out below for safety).
-- ============================================================

-- -------------------------------------------------------
-- 1. Create StudyAgeGroup table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `StudyAgeGroup` (
  `id`       INT          NOT NULL AUTO_INCREMENT,
  `FK_Study` INT          NOT NULL,
  `MinAge`   DECIMAL(10,2) NOT NULL,
  `MaxAge`   DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_studyagegroup_study`
    FOREIGN KEY (`FK_Study`) REFERENCES `Study` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 2. Seed StudyAgeGroup from existing Study age columns
--    (only for rows that have valid, non-zero values)
-- -------------------------------------------------------
INSERT INTO `StudyAgeGroup` (`FK_Study`, `MinAge`, `MaxAge`)
SELECT `id`, `MinAge`, `MaxAge`
FROM   `Study`
WHERE  `MinAge` IS NOT NULL
  AND  `MaxAge` IS NOT NULL
  AND  `MinAge` > 0
  AND  `MaxAge` > 0;

-- -------------------------------------------------------
-- 3. Create prerequisite junction table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `StudyPrerequisites` (
  `StudyId`       INT NOT NULL,
  `RequirementId` INT NOT NULL,
  PRIMARY KEY (`StudyId`, `RequirementId`),
  CONSTRAINT `fk_prereq_study`
    FOREIGN KEY (`StudyId`) REFERENCES `Study` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_prereq_requirement`
    FOREIGN KEY (`RequirementId`) REFERENCES `Study` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 4. Create exclusion junction table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `StudyExclusions` (
  `StudyId`    INT NOT NULL,
  `ExcludedId` INT NOT NULL,
  PRIMARY KEY (`StudyId`, `ExcludedId`),
  CONSTRAINT `fk_excl_study`
    FOREIGN KEY (`StudyId`) REFERENCES `Study` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_excl_excluded`
    FOREIGN KEY (`ExcludedId`) REFERENCES `Study` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------
-- 5. (Optional) Verify the migration before proceeding
-- -------------------------------------------------------
-- SELECT s.id, s.StudyName, s.MinAge AS old_MinAge, s.MaxAge AS old_MaxAge,
--        ag.MinAge AS new_MinAge, ag.MaxAge AS new_MaxAge
-- FROM Study s
-- LEFT JOIN StudyAgeGroup ag ON ag.FK_Study = s.id
-- ORDER BY s.id;

-- -------------------------------------------------------
-- 6. AFTER verifying data integrity, drop the old columns:
--    (Uncomment only once you are confident migration is correct)
-- -------------------------------------------------------
-- ALTER TABLE `Study` DROP COLUMN `MinAge`;
-- ALTER TABLE `Study` DROP COLUMN `MaxAge`;
