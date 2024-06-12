SELECT
    pnb_drdb.Lab.LabName,
    pnb_drdb.Schedule.Status,
    COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01'
    AND '2023-12-31'
GROUP BY
    pnb_drdb.Study.FK_Lab,
    pnb_drdb.Schedule.Status;


-- number of participants per lab
SELECT
    pnb_drdb.Lab.LabName,
    pnb_drdb.Schedule.Status,
    COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt BETWEEN '2023-01-01'
    AND '2023-12-31'
GROUP BY
    pnb_drdb.Study.FK_Lab,
    pnb_drdb.Schedule.Status;


-- number of participants studies of each month
SELECT
    YEAR(pnb_drdb.Schedule.AppointmentTime) AS Year,
    DATE_FORMAT(pnb_drdb.Schedule.AppointmentTime, '%b') AS Month,
    DATE_FORMAT(pnb_drdb.Schedule.AppointmentTime, '%b 1 %Y') AS YearMonth,
    COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt BETWEEN '2021-01-01'
    AND '2024-12-31'
    AND pnb_drdb.Schedule.Status = "Confirmed"
    AND pnb_drdb.Lab.id = 2
    AND YEAR(pnb_drdb.Schedule.AppointmentTime) > 2020
GROUP BY
    YEAR(pnb_drdb.Schedule.AppointmentTime),
    MONTH(pnb_drdb.Schedule.AppointmentTime)
ORDER BY
    YEAR(pnb_drdb.Schedule.AppointmentTime),
    MONTH(pnb_drdb.Schedule.AppointmentTime);
    

-- number of participants for in-person studies of each weekday
SELECT
    YEAR(pnb_drdb.Schedule.AppointmentTime) AS Year,
    DATE_FORMAT(pnb_drdb.Schedule.AppointmentTime, '%b') AS Month,
    DATE_FORMAT(pnb_drdb.Schedule.AppointmentTime, '%a') AS weekday,
    COUNT(pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt BETWEEN '2021-01-01'
    AND '2024-12-31'
    AND pnb_drdb.Schedule.Status = "Confirmed"
    AND pnb_drdb.Lab.id = 2
    AND YEAR(pnb_drdb.Schedule.AppointmentTime) > 2020
GROUP BY
    YEAR(pnb_drdb.Schedule.AppointmentTime),
    MONTH(pnb_drdb.Schedule.AppointmentTime),
    DAYOFWEEK(pnb_drdb.Schedule.AppointmentTime)
ORDER BY
    DAYOFWEEK(pnb_drdb.Schedule.AppointmentTime);


-- number of participants ran as primary experimenter
SELECT
    pnb_drdb.Study.StudyName,
    PrimaryExperimenter.Name as PrimaryExperimenter,
    COUNT(DISTINCT pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    JOIN pnb_drdb.ExperimenterAssignment ON pnb_drdb.Appointment.id = pnb_drdb.ExperimenterAssignment.FK_Appointment
	JOIN pnb_drdb.Personnel AS PrimaryExperimenter ON pnb_drdb.ExperimenterAssignment.FK_Experimenter = PrimaryExperimenter.id
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Personnel ON pnb_drdb.Schedule.ScheduledBy = pnb_drdb.Personnel.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt > '2021-01-01'
    AND pnb_drdb.Study.id = 217
    AND pnb_drdb.Schedule.Status = 'Confirmed'
GROUP BY
    PrimaryExperimenter.Name,
    pnb_drdb.Schedule.Status;

-- number of participants ran as assistant experimenter
SELECT
    pnb_drdb.Study.StudyName,
    AssistantExperimenter.Name as AssistantExperimenter,
    COUNT(DISTINCT pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.ExperimenterAssignment ON pnb_drdb.Appointment.id = pnb_drdb.ExperimenterAssignment.FK_Appointment
	INNER JOIN pnb_drdb.Personnel AS PrimaryExperimenter ON pnb_drdb.ExperimenterAssignment.FK_Experimenter = PrimaryExperimenter.id
    INNER JOIN pnb_drdb.SecondExperimenterAssignment ON pnb_drdb.Appointment.id = pnb_drdb.SecondExperimenterAssignment.FK_Appointment
    INNER JOIN pnb_drdb.Personnel AS AssistantExperimenter ON pnb_drdb.SecondExperimenterAssignment.FK_Experimenter = AssistantExperimenter.id
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Personnel ON pnb_drdb.Schedule.ScheduledBy = pnb_drdb.Personnel.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
    pnb_drdb.Schedule.createdAt > '2021-01-01'
    AND pnb_drdb.Study.id = 217
    AND pnb_drdb.Schedule.Status = 'Confirmed'
GROUP BY
    AssistantExperimenter.Name,
    pnb_drdb.Schedule.Status;

-- number of participants recruited by each personnel and appointment status
SELECT
    pnb_drdb.Study.StudyName,
    pnb_drdb.Personnel.Name as RecruitedBy,
    pnb_drdb.Schedule.Status,
    COUNT(DISTINCT pnb_drdb.Appointment.id) AS NumberOfParticipants
FROM
    pnb_drdb.Appointment
    INNER JOIN pnb_drdb.Schedule ON pnb_drdb.Appointment.FK_Schedule = pnb_drdb.Schedule.id
    INNER JOIN pnb_drdb.Personnel ON pnb_drdb.Schedule.ScheduledBy = pnb_drdb.Personnel.id
    INNER JOIN pnb_drdb.Study ON pnb_drdb.Appointment.FK_Study = pnb_drdb.Study.id
    INNER JOIN pnb_drdb.Lab ON pnb_drdb.Study.FK_Lab = pnb_drdb.Lab.id
WHERE
     pnb_drdb.Study.id = 217
GROUP BY
    ScheduledBy,
    pnb_drdb.Schedule.Status;