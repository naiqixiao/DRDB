/*
in Terminal, log in to the MySQL Server using the user you created before.
mysql -u yourusername -p
cd ~/DRDB
mysql -u yourusername -p DRDB < MySQL/databasePatch1.01.sql
*/
DELIMITER $$
DROP PROCEDURE IF EXISTS updateDatabase $$
CREATE PROCEDURE updateDatabase()

BEGIN

IF 
NOT EXISTS ((SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=database()
            AND COLUMN_NAME='eventURL' AND TABLE_NAME='Appointment')) 
THEN
    ALTER TABLE Appointment ADD eventURL varchar(150) DEFAULT NULL AFTER FK_Family;
END IF;

IF 
NOT EXISTS ((SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=database()
            AND COLUMN_NAME='calendarEventId' AND TABLE_NAME='Appointment')) 
THEN
    ALTER TABLE Appointment ADD calendarEventId varchar(30) DEFAULT NULL AFTER eventURL;
END IF;

CREATE TABLE IF NOT EXISTS TestingRoom (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `FK_Lab` INT NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `calendar` varchar(255) NOT NULL,
  `calendarId` varchar(255) NOT NULL,
  `createdBy` INT,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `voided` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `calendar` (`calendar`),
  KEY `FK_lab` (`FK_Lab`),
  CONSTRAINT `FK_lab` FOREIGN KEY (`FK_Lab`) REFERENCES `Lab` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

IF 
NOT EXISTS ((SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=database()
            AND COLUMN_NAME='FK_TestingRoom' AND TABLE_NAME='Study')) 
THEN
    ALTER TABLE Study ADD FK_TestingRoom int AFTER FK_Personnel,
    ADD KEY `FK_TestingRoom` (`FK_TestingRoom`),
    ADD CONSTRAINT `FK_TestingRoom` FOREIGN KEY (`FK_TestingRoom`) REFERENCES `TestingRoom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
END IF;

END $$
CALL updateDatabase() $$
DELIMITER ;