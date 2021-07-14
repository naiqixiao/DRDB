-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: localhost    Database: DRDB
-- ------------------------------------------------------
-- Server version	8.0.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Appointment`
--

DROP TABLE IF EXISTS `Appointment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `FK_Study` int NOT NULL,
  `FK_Child` int NOT NULL,
  `FK_Schedule` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `FK_Family` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `FK_Child_idx` (`FK_Child`),
  KEY `FK_Study_idx` (`FK_Study`),
  KEY `FK_Schedule_idx` (`FK_Schedule`),
  KEY `FK_Family_idx` (`FK_Family`),
  CONSTRAINT `Family` FOREIGN KEY (`FK_Family`) REFERENCES `Family` (`id`),
  CONSTRAINT `FK_Child` FOREIGN KEY (`FK_Child`) REFERENCES `Child` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_Schedule` FOREIGN KEY (`FK_Schedule`) REFERENCES `Schedule` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_Study` FOREIGN KEY (`FK_Study`) REFERENCES `Study` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=465 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Child`
--

DROP TABLE IF EXISTS `Child`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Child` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(30) DEFAULT 'UNKNOWN',
  `Sex` varchar(1) DEFAULT NULL,
  `DoB` date DEFAULT NULL,
  `Age` int DEFAULT NULL,
  `Language` varchar(45) DEFAULT NULL,
  `IdWithinFamily` varchar(1) DEFAULT NULL,
  `HearingLoss` int DEFAULT '0',
  `VisionLoss` int DEFAULT '0',
  `PrematureBirth` int DEFAULT '0',
  `Illness` int DEFAULT '0',
  `Note` text,
  `FK_Family` int DEFAULT NULL,
  `BirthWeight` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `HomeLanguage` varchar(100) DEFAULT NULL,
  `SchoolLanguage` varchar(100) DEFAULT NULL,
  `School` varchar(100) DEFAULT NULL,
  `Gestation` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Child_ibfk_1` (`FK_Family`),
  CONSTRAINT `Child_ibfk_1` FOREIGN KEY (`FK_Family`) REFERENCES `Family` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13751 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Conversations`
--

DROP TABLE IF EXISTS `Conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Conversation` text NOT NULL,
  `Time` datetime NOT NULL,
  `FK_Family` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `FK_Family` (`FK_Family`),
  CONSTRAINT `Conversations_ibfk_1` FOREIGN KEY (`FK_Family`) REFERENCES `Family` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Experimenter`
--

DROP TABLE IF EXISTS `Experimenter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Experimenter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `FK_Experimenter` int NOT NULL,
  `FK_Study` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Experimenter_FK_Study_FK_Experimenter_unique` (`FK_Experimenter`,`FK_Study`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `FK_Study` (`FK_Study`),
  CONSTRAINT `Experimenter_ibfk_1` FOREIGN KEY (`FK_Experimenter`) REFERENCES `Personnel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Experimenter_ibfk_2` FOREIGN KEY (`FK_Study`) REFERENCES `Study` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ExperimenterAssignment`
--

DROP TABLE IF EXISTS `ExperimenterAssignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExperimenterAssignment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `FK_Experimenter` int NOT NULL,
  `FK_Appointment` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `FK_Experimenter_idx` (`FK_Experimenter`),
  KEY `FK_Appointment_idx` (`FK_Appointment`),
  CONSTRAINT `FK_Appointment` FOREIGN KEY (`FK_Appointment`) REFERENCES `Appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_Experimenter` FOREIGN KEY (`FK_Experimenter`) REFERENCES `Personnel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Family`
--

DROP TABLE IF EXISTS `Family`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Family` (
  `id` int NOT NULL AUTO_INCREMENT,
  `NamePrimary` varchar(50) DEFAULT NULL,
  `NameSecondary` varchar(50) DEFAULT NULL,
  `Email` varchar(40) DEFAULT NULL,
  `Phone` varchar(10) DEFAULT NULL,
  `CellPhone` varchar(10) DEFAULT NULL,
  `RacePrimary` varchar(20) DEFAULT NULL,
  `RaceSecondary` varchar(20) DEFAULT NULL,
  `LanguagePrimary` varchar(20) DEFAULT NULL,
  `LanguageSecondary` varchar(20) DEFAULT NULL,
  `EnglishPercent` int DEFAULT NULL,
  `Note` text,
  `Vehicle` text,
  `Address` text,
  `LastContactDate` date DEFAULT NULL,
  `NextContactDate` date DEFAULT NULL,
  `NextContactNote` text,
  `RecruitmentMethod` varchar(100) DEFAULT 'Hospital',
  `AssignedLab` int DEFAULT NULL,
  `CreatedBy` int DEFAULT NULL,
  `UpdatedBy` int DEFAULT NULL,
  `NoMoreContact` int DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `CreatedBy` (`CreatedBy`),
  KEY `UpdatedBy` (`UpdatedBy`),
  KEY `CurrentLab_idx` (`AssignedLab`),
  CONSTRAINT `AssignedLab` FOREIGN KEY (`AssignedLab`) REFERENCES `Lab` (`id`),
  CONSTRAINT `Family_ibfk_1` FOREIGN KEY (`CreatedBy`) REFERENCES `Personnel` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Family_ibfk_2` FOREIGN KEY (`UpdatedBy`) REFERENCES `Personnel` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22865 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Feedback`
--

DROP TABLE IF EXISTS `Feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Content` longtext NOT NULL,
  `CreatedBy` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CurrentPage` varchar(45) NOT NULL,
  `Title` varchar(45) NOT NULL,
  `Email` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `FK_Personnel_idx` (`CreatedBy`),
  CONSTRAINT `FK_Personnel` FOREIGN KEY (`CreatedBy`) REFERENCES `Personnel` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Lab`
--

DROP TABLE IF EXISTS `Lab`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Lab` (
  `id` int NOT NULL AUTO_INCREMENT,
  `LabName` varchar(45) NOT NULL,
  `PI` varchar(45) NOT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `EmailOpening` mediumtext,
  `EmailClosing` mediumtext,
  `Location` mediumtext,
  `TransportationInstructions` mediumtext,
  `ZoomLink` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `LabName` (`LabName`),
  UNIQUE KEY `PI` (`PI`),
  UNIQUE KEY `Email_UNIQUE` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Personnel`
--

DROP TABLE IF EXISTS `Personnel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Personnel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(45) NOT NULL,
  `Initial` varchar(45) NOT NULL,
  `Role` enum('Admin','PostDoc','PI','GradStudent','Undergrad','RA','Lab manager','Staff') NOT NULL,
  `FK_Lab` int DEFAULT NULL,
  `Active` int NOT NULL DEFAULT '1',
  `Password` varchar(255) NOT NULL,
  `Email` varchar(45) NOT NULL,
  `Calendar` varchar(100) NOT NULL,
  `Phone` varchar(10) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `temporaryPassword` tinyint NOT NULL DEFAULT '0',
  `ZoomLink` varchar(300) DEFAULT NULL,
  `Retired` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Initial` (`Initial`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `Calendar` (`Calendar`),
  KEY `Personnel_ibfk_1` (`FK_Lab`),
  CONSTRAINT `Personnel_ibfk_1` FOREIGN KEY (`FK_Lab`) REFERENCES `Lab` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Schedule`
--

DROP TABLE IF EXISTS `Schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `AppointmentTime` datetime DEFAULT NULL,
  `Status` enum('Confirmed','TBD','Rescheduling','Rescheduled','No Show','Cancelled','Rejected') NOT NULL,
  `Reminded` int NOT NULL DEFAULT '0',
  `ThankYouEmail` int NOT NULL DEFAULT '0',
  `Note` text,
  `ScheduledBy` int NOT NULL,
  `FK_Family` int NOT NULL,
  `eventURL` varchar(150) DEFAULT NULL,
  `calendarEventId` varchar(30) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Completed` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_Family_idx` (`FK_Family`),
  KEY `ScheduledBy_idx` (`ScheduledBy`),
  CONSTRAINT `FK_Family` FOREIGN KEY (`FK_Family`) REFERENCES `Family` (`id`),
  CONSTRAINT `ScheduledBy` FOREIGN KEY (`ScheduledBy`) REFERENCES `Personnel` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Sibling`
--

DROP TABLE IF EXISTS `Sibling`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sibling` (
  `id` int NOT NULL AUTO_INCREMENT,
  `FK_Child` int NOT NULL,
  `Sibling` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `actions_unique` (`FK_Child`,`Sibling`),
  KEY `Sibling` (`Sibling`),
  CONSTRAINT `Sibling_ibfk_1` FOREIGN KEY (`FK_Child`) REFERENCES `Child` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Sibling_ibfk_2` FOREIGN KEY (`Sibling`) REFERENCES `Child` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44303 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Study`
--

DROP TABLE IF EXISTS `Study`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Study` (
  `id` int NOT NULL AUTO_INCREMENT,
  `StudyName` varchar(45) NOT NULL,
  `MinAge` decimal(5,2) NOT NULL,
  `MaxAge` decimal(5,2) NOT NULL,
  `Description` text NOT NULL,
  `EmailTemplate` text NOT NULL,
  `Completed` int NOT NULL DEFAULT '0',
  `FK_Lab` int NOT NULL,
  `FK_Personnel` int NOT NULL,
  `StudyType` varchar(30) NOT NULL,
  `ASDParticipant` enum('Include','Exclude','Only') NOT NULL DEFAULT 'Include',
  `PrematureParticipant` enum('Include','Exclude','Only') NOT NULL DEFAULT 'Include',
  `VisionLossParticipant` enum('Include','Exclude','Only') NOT NULL DEFAULT 'Include',
  `HearingLossParticipant` enum('Include','Exclude','Only') NOT NULL DEFAULT 'Include',
  `IllParticipant` enum('Include','Exclude','Only') NOT NULL DEFAULT 'Include',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ReminderTemplate` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_Lab` (`FK_Lab`),
  KEY `FK_Personnel_idx` (`FK_Personnel`),
  CONSTRAINT `Personnel_ibfk_3` FOREIGN KEY (`FK_Personnel`) REFERENCES `Personnel` (`id`),
  CONSTRAINT `Study_ibfk_1` FOREIGN KEY (`FK_Lab`) REFERENCES `Lab` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-11-02  8:51:04
