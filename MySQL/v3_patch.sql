ALTER TABLE Schedule
MODIFY COLUMN `Status` ENUM('Confirmed','TBD','Rescheduling','Rescheduled','No Show','Cancelled','Rejected','Interested','Left a message') NOT NULL;
