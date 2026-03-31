-- DRDB database patch 1.02
-- Adds persistence table for lab-level scheduled job runtime settings.
-- Safe to run multiple times.

-- REQUIRED: set this to your target DRDB schema before running.
USE `your_database_name`;

CREATE TABLE IF NOT EXISTS `ScheduledJobSetting` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `FK_Lab` INT NOT NULL,
  `JobId` VARCHAR(100) NOT NULL,
  `CronExpression` VARCHAR(100) NOT NULL,
  `Enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_scheduled_job_setting_lab_job` (`FK_Lab`, `JobId`),
  KEY `idx_scheduled_job_setting_lab` (`FK_Lab`),
  CONSTRAINT `fk_scheduled_job_setting_lab`
    FOREIGN KEY (`FK_Lab`) REFERENCES `Lab` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
