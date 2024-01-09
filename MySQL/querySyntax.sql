SELECT pnb_drdb.Lab.LabName, pnb_drdb.Schedule.Status, COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM pnb_drdb.Appointment
INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY pnb_drdb.Study.FK_Lab, pnb_drdb.Schedule.Status;

-- number of participants per lab
SELECT pnb_drdb.Lab.LabName, pnb_drdb.Schedule.Status, COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM pnb_drdb.Appointment
INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01' AND '2023-12-31'
GROUP BY pnb_drdb.Study.FK_Lab, pnb_drdb.Schedule.Status;

-- number of participants studies of each month
SELECT MONTH(pnb_drdb.Schedule.AppointmentTime), COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM pnb_drdb.Appointment
INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01' AND '2023-12-31' AND pnb_drdb.Schedule.Status = "Confirmed"
GROUP BY MONTH(pnb_drdb.Schedule.AppointmentTime)
ORDER BY MONTH(pnb_drdb.Schedule.AppointmentTime);

-- number of participants for in-person studies of each weekday
SELECT CASE DAYOFWEEK(pnb_drdb.Schedule.AppointmentTime)
        WHEN 1 THEN 'Sunday'
        WHEN 2 THEN 'Monday'
        WHEN 3 THEN 'Tuesday'
        WHEN 4 THEN 'Wednesday'
        WHEN 5 THEN 'Thursday'
        WHEN 6 THEN 'Friday'
        ELSE 'Saturday'
    END AS weekday, COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM pnb_drdb.Appointment
INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01' AND '2023-12-31' AND pnb_drdb.Schedule.Status = "Confirmed" AND pnb_drdb.Study.StudyType <> "Online"
GROUP BY DAYOFWEEK(pnb_drdb.Schedule.AppointmentTime)
ORDER BY DAYOFWEEK(pnb_drdb.Schedule.AppointmentTime);