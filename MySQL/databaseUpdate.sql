
ALTER TABLE Appointment ADD eventURL varchar(150) DEFAULT NULL AFTER FK_Family;

ALTER TABLE Appointment ADD calendarEventId varchar(30) DEFAULT NULL AFTER eventURL;

CREATE TABLE testingroom (
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

ALTER TABLE Study ADD FK_TestingRoom int AFTER FK_Personnel,
ADD KEY `FK_TestingRoom` (`FK_TestingRoom`),
ADD CONSTRAINT `FK_TestingRoom` FOREIGN KEY (`FK_TestingRoom`) REFERENCES `TestingRoom` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
