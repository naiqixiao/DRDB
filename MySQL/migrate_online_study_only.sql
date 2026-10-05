-- Apply once to an existing database if the automatic startup patch cannot run.
ALTER TABLE `Family`
  ADD COLUMN `OnlineStudyOnly` INT NOT NULL DEFAULT 0;
