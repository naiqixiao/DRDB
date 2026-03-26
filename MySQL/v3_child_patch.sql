/*
  V3 Child Table Patch
  Adds columns that V3 requires but may be missing from V2 production databases.
  Safe to run multiple times — uses IF NOT EXISTS checks.

  Run with:
    mysql -u yourusername -p DRDB < MySQL/v3_child_patch.sql
*/

DELIMITER $$
DROP PROCEDURE IF EXISTS patchChildTable $$
CREATE PROCEDURE patchChildTable()
BEGIN

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='ASD') THEN
    ALTER TABLE Child ADD COLUMN ASD INT DEFAULT 0 AFTER PrematureBirth;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='HomeLanguage') THEN
    ALTER TABLE Child ADD COLUMN HomeLanguage VARCHAR(100) DEFAULT NULL AFTER updatedAt;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='SchoolLanguage') THEN
    ALTER TABLE Child ADD COLUMN SchoolLanguage VARCHAR(100) DEFAULT NULL AFTER HomeLanguage;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='School') THEN
    ALTER TABLE Child ADD COLUMN School VARCHAR(100) DEFAULT NULL AFTER SchoolLanguage;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='RecruitmentMethod') THEN
    ALTER TABLE Child ADD COLUMN RecruitmentMethod VARCHAR(100) DEFAULT 'Hospital' AFTER School;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='Gestation') THEN
    ALTER TABLE Child ADD COLUMN Gestation DECIMAL(5,2) DEFAULT NULL AFTER RecruitmentMethod;
  END IF;

  IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA=database() AND TABLE_NAME='Child' AND COLUMN_NAME='Gender') THEN
    ALTER TABLE Child ADD COLUMN Gender VARCHAR(1) DEFAULT NULL AFTER Gestation;
  END IF;

END $$
CALL patchChildTable() $$
DELIMITER ;
