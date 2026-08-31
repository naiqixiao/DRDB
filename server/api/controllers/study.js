const model = require("../models/DRDB");
const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");
const config = require("../../config/general");
const { recordPersonnelHistory } = require("../services/personnelHistoryService");

const STUDY_CRITERIA_DEFAULTS = {
  ASDParticipant: "Include",
  PrematureParticipant: "Include",
  VisionLossParticipant: "Include",
  HearingLossParticipant: "Include",
  IllParticipant: "Include",
};

function normalizeStudyWritePayload(payload = {}) {
  return {
    ...payload,
    Completed: payload.Completed ?? false,
    Description: payload.Description ?? "",
    PhoneScript: payload.PhoneScript ?? "",
    EmailTemplate: payload.EmailTemplate ?? "",
    ReminderTemplate: payload.ReminderTemplate ?? "",
    FollowUPEmailSnippet: payload.FollowUPEmailSnippet ?? "",
    StudyType: payload.StudyType ?? "Behavioural",
    ...Object.fromEntries(
      Object.entries(STUDY_CRITERIA_DEFAULTS).map(([key, fallback]) => [
        key,
        payload[key] ?? fallback,
      ])
    ),
  };
}

function getMissingRequiredFields(payload, requiredKeys) {
  return requiredKeys.filter((key) => payload[key] === undefined || payload[key] === null || payload[key] === "");
}

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  const { AgeGroups, PrerequisiteIds, ExclusionIds, User, ...incomingStudyInfo } = req.body;
  const newStudyInfo = normalizeStudyWritePayload(incomingStudyInfo);

  const missingFields = getMissingRequiredFields(newStudyInfo, [
    "StudyName",
    "FK_Lab",
    "FK_Personnel",
  ]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required field(s): ${missingFields.join(", ")}`,
    });
  }

  try {
    const study = await model.sequelize.transaction(async (transaction) => {
      const created = await model.study.create(
        { ...newStudyInfo, AgeGroups: AgeGroups || [] },
        {
          include: [{ model: model.studyAgeGroup, as: "AgeGroups" }],
          transaction,
        }
      );

      await recordPersonnelHistory(model, {
        FK_Personnel: created.FK_Personnel, FK_Lab: created.FK_Lab,
        EventType: "leadership_started", EffectiveDate: created.createdAt,
        FK_Study: created.id, StudyName: created.StudyName, CreatedBy: req.userData?.id || null,
      }, { transaction });

      if (PrerequisiteIds && PrerequisiteIds.length > 0) {
        await created.setPrerequisites(PrerequisiteIds, { transaction });
      }
      if (ExclusionIds && ExclusionIds.length > 0) {
        await created.setExclusions(ExclusionIds, { transaction });
      }

      return await model.study.findOne({
        where: { id: created.id },
        include: [
          { model: model.studyAgeGroup, as: "AgeGroups" },
          { model: model.study, as: "Prerequisites", attributes: ["id", "StudyName"] },
          { model: model.study, as: "Exclusions", attributes: ["id", "StudyName"] },
          model.lab,
          { model: model.personnel, as: "PointofContact" },
          {
            model: model.personnel,
            as: "Experimenters",
            through: { model: model.experimenter },
          },
        ],
        transaction,
      });
    });

    await log.createLog(
      "Study Created",
      User,
      "created a study (" + study.StudyName + ")"
    );

    res.status(200).send(study);
  } catch (error) {
    console.error("Study create error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve all studies from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = req.query;

  includeScheules = queryString.includeScheules;
  delete queryString.includeScheules;

  try {
    let study = [];

    const commonIncludes = [
      { model: model.studyAgeGroup, as: "AgeGroups", separate: true },
      { model: model.study, as: "Prerequisites", attributes: ["id", "StudyName"] },
      { model: model.study, as: "Exclusions", attributes: ["id", "StudyName"] },
      model.lab,
      { model: model.personnel, as: "PointofContact" },
      {
        model: model.personnel,
        as: "Experimenters",
        through: { model: model.experimenter },
      },
    ];

    if (includeScheules === "true") {
      study = await model.study.findAll({
        where: queryString,
        include: [
          { model: model.appointment, separate: true },
          ...commonIncludes,
        ],
      });
    } else {
      study = await model.study.findAll({
        where: queryString,
        include: commonIncludes,
      });
    }

    console.log("Search successful!");

    res.status(200).send(study);
  } catch (error) {
    console.error("Study search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  const ID = req.body.id;
  const { id, AgeGroups, PrerequisiteIds, ExclusionIds, User, ...incomingStudyInfo } = req.body;
  const updatedStudyInfo = normalizeStudyWritePayload(incomingStudyInfo);

  const missingFields = getMissingRequiredFields(updatedStudyInfo, [
    "StudyName",
    "FK_Lab",
    "FK_Personnel",
  ]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required field(s): ${missingFields.join(", ")}`,
    });
  }

  try {
    const previousStudy = await model.study.findByPk(ID);
    if (!previousStudy) return res.status(404).json({ error: "Study not found." });
    await model.sequelize.transaction(async (transaction) => {
      await model.study.update(updatedStudyInfo, { where: { id: ID }, transaction });
      if (updatedStudyInfo.FK_Personnel !== undefined && updatedStudyInfo.FK_Personnel !== previousStudy.FK_Personnel) {
        await recordPersonnelHistory(model, {
          FK_Personnel: previousStudy.FK_Personnel, FK_Lab: previousStudy.FK_Lab,
          EventType: "leadership_ended", FK_Study: previousStudy.id, StudyName: previousStudy.StudyName,
          CreatedBy: req.userData?.id || null,
        }, { transaction });
        await recordPersonnelHistory(model, {
          FK_Personnel: updatedStudyInfo.FK_Personnel, FK_Lab: previousStudy.FK_Lab,
          EventType: "leadership_started", FK_Study: previousStudy.id,
          StudyName: updatedStudyInfo.StudyName || previousStudy.StudyName, CreatedBy: req.userData?.id || null,
        }, { transaction });
      }
    });

    // Sync age groups: replace existing with the new set
    await model.studyAgeGroup.destroy({ where: { FK_Study: ID } });
    if (AgeGroups && AgeGroups.length > 0) {
      await model.studyAgeGroup.bulkCreate(
        AgeGroups.map((g) => ({ MinAge: g.MinAge, MaxAge: g.MaxAge, FK_Study: ID }))
      );
    }

    // Sync prerequisites and exclusions via Sequelize mixins
    const studyInstance = await model.study.findOne({ where: { id: ID } });
    if (PrerequisiteIds !== undefined) {
      await studyInstance.setPrerequisites(PrerequisiteIds || []);
    }
    if (ExclusionIds !== undefined) {
      await studyInstance.setExclusions(ExclusionIds || []);
    }

    const study = await model.study.findOne({
      where: { id: ID },
      include: [
        { model: model.studyAgeGroup, as: "AgeGroups" },
        { model: model.study, as: "Prerequisites", attributes: ["id", "StudyName"] },
        { model: model.study, as: "Exclusions", attributes: ["id", "StudyName"] },
        model.appointment,
        model.lab,
        { model: model.personnel, as: "PointofContact" },
        {
          model: model.personnel,
          as: "Experimenters",
          through: { model: model.experimenter },
        },
      ],
    });

    await log.createLog(
      "Study Updated",
      User,
      "update a study's information (" + updatedStudyInfo.StudyName + ")"
    );

    res.status(200).send(study);
  } catch (error) {
    console.error("Study update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  try {
    const study = await model.study.destroy({
      where: { id: req.query.id },
    });

    // Log
    const User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;

    await log.createLog(
      "Study Deleted",
      User,
      "deleted a study (" + req.query.id + ")"
    );

    res.status(200).json(study);
  } catch (error) {
    console.error("Study delete error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Retrieve study progress infomation from the database.
exports.studyStats = asyncHandler(async (req, res) => {
  const studyID = Number(req.query.studyID);

  if (!Number.isInteger(studyID) || studyID <= 0) {
    return res.status(400).json({ error: "Valid studyID is required." });
  }

  try {
    const requester = await model.personnel.findOne({
      where: { id: req.userData?.id },
      attributes: ["id", "FK_Lab"],
    });

    if (!requester) {
      return res.status(401).json({ error: "Authentication failed." });
    }

    const requestedStudy = await model.study.findOne({
      where: { id: studyID },
      attributes: ["id", "FK_Lab"],
    });

    if (!requestedStudy) {
      return res.status(404).json({ error: "Study not found." });
    }

    if (requestedStudy.FK_Lab !== requester.FK_Lab) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const queryStringN = `
      SELECT 
        Study.StudyName, 
        Schedule.Status, 
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Personnel ON Schedule.ScheduledBy = Personnel.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
      GROUP BY Schedule.Status;
    `;

    const queryStringNperPersonnel = `
      SELECT 
        Study.StudyName, 
        Personnel.id as RecruiterId,
        Personnel.Name as RecruitedBy, 
        Personnel.Retired as Retired,
        Schedule.Status, 
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Personnel ON Schedule.ScheduledBy = Personnel.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
      GROUP BY Study.StudyName, Personnel.id, Personnel.Name, Personnel.Retired, Schedule.Status
      ORDER BY Personnel.id;
    `;

    const queryStringNPriExp = `
      SELECT 
        Study.StudyName, 
        Experimenter.id as ExperimenterId,
        Experimenter.Name as Experimenter, 
        Experimenter.Retired as Retired,
        'Primary' as ROLE,  
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      JOIN ExperimenterAssignment ON Appointment.id = ExperimenterAssignment.FK_Appointment 
      JOIN Personnel AS Experimenter ON ExperimenterAssignment.FK_Experimenter = Experimenter.id 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
        AND Schedule.Status = 'Confirmed'  
      GROUP BY Study.StudyName, Experimenter.Name, Experimenter.id, Experimenter.Retired, Schedule.Status
      ORDER BY Experimenter.id;
    `;

    const queryStringNAssistExp = `
      SELECT 
        Study.StudyName, 
        Experimenter.id as ExperimenterId,
        Experimenter.Name as Experimenter,  
        Experimenter.Retired as Retired,
        'Assistant' as ROLE,   
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      INNER JOIN SecondExperimenterAssignment ON Appointment.id = SecondExperimenterAssignment.FK_Appointment 
      INNER JOIN Personnel AS Experimenter ON SecondExperimenterAssignment.FK_Experimenter = Experimenter.id 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
        AND Schedule.Status = 'Confirmed'  
      GROUP BY Study.StudyName, Experimenter.id, Experimenter.Name, Experimenter.Retired, Schedule.Status
      ORDER BY Experimenter.id;
    `;

    // A durable study roster built from current assignments, personnel history,
    // appointment assignments, and recruitment records. This keeps former and
    // zero-activity researchers visible without treating the current assignment
    // table as historical data.
    const queryStringResearchers = `
      SELECT DISTINCT
        Personnel.id as PersonnelId,
        Personnel.Name as Name,
        Personnel.Retired as Retired
      FROM Personnel
      INNER JOIN (
        SELECT FK_Experimenter as PersonnelId
        FROM Experimenter
        WHERE FK_Study = :studyID

        UNION

        SELECT FK_Personnel as PersonnelId
        FROM PersonnelHistory
        WHERE FK_Study = :studyID
          AND EventType IN ('project_started', 'project_ended')

        UNION

        SELECT ExperimenterAssignment.FK_Experimenter as PersonnelId
        FROM ExperimenterAssignment
        INNER JOIN Appointment ON Appointment.id = ExperimenterAssignment.FK_Appointment
        WHERE Appointment.FK_Study = :studyID

        UNION

        SELECT SecondExperimenterAssignment.FK_Experimenter as PersonnelId
        FROM SecondExperimenterAssignment
        INNER JOIN Appointment ON Appointment.id = SecondExperimenterAssignment.FK_Appointment
        WHERE Appointment.FK_Study = :studyID

        UNION

        SELECT Schedule.ScheduledBy as PersonnelId
        FROM Schedule
        INNER JOIN Appointment ON Appointment.FK_Schedule = Schedule.id
        WHERE Appointment.FK_Study = :studyID
      ) StudyPersonnel ON StudyPersonnel.PersonnelId = Personnel.id
      ORDER BY Personnel.Retired ASC, Personnel.Name ASC, Personnel.id ASC;
    `;

    const queryStringNWeeklyRecrtuiment = `
      SELECT 
        YEAR(Schedule.createdAt) AS Year, 
        Schedule.Status AS Status, 
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants, 
        DATE_FORMAT(DATE_SUB(Schedule.createdAt, INTERVAL WEEKDAY(Schedule.createdAt) DAY), '%Y-%m-%d') AS WeekStartDate 
      FROM Appointment 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Schedule.createdAt > '2021-01-01' 
        AND Study.id = :studyID 
        AND Family.TrainingSet = 0 
      GROUP BY Year, WeekStartDate, Status 
      ORDER BY Year, WeekStartDate;
    `;

    const queryStringCompletedRuns = `
      SELECT COUNT(DISTINCT Appointment.id) AS NumberOfParticipants
      FROM Appointment
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id
      INNER JOIN Study ON Appointment.FK_Study = Study.id
      INNER JOIN Family ON Schedule.FK_Family = Family.id
      WHERE Study.id = :studyID
        AND Family.TrainingSet = 0
        AND Schedule.Completed = 1;
    `;

    // Safely execute queries with parameter binding
    const options = { replacements: { studyID }, type: QueryTypes.SELECT };

    const totalNperStatus = await model.sequelize.query(queryStringN, options);
    const totalNperPersonnelStatus = await model.sequelize.query(queryStringNperPersonnel, options);
    const totalNperPersonnelPriExp = await model.sequelize.query(queryStringNPriExp, options);
    const totalNperPersonnelAssistExp = await model.sequelize.query(queryStringNAssistExp, options);
    const researchers = await model.sequelize.query(queryStringResearchers, options);
    const totalNWeeklyRecrtuiment = await model.sequelize.query(queryStringNWeeklyRecrtuiment, options);
    const totalCompletedRunsResult = await model.sequelize.query(queryStringCompletedRuns, options);
    const totalCompletedRuns = totalCompletedRunsResult?.[0]?.NumberOfParticipants || 0;

    // QueryTypes.SELECT returns data directly without the metadata wrapper
    res.status(200).send({ 
      totalNperStatus, 
      totalNperPersonnelStatus, 
      totalNperPersonnelPriExp, 
      totalNperPersonnelAssistExp, 
      researchers,
      totalNWeeklyRecrtuiment,
      totalCompletedRuns
    });
  } catch (error) {
    console.error("Study stats error:", error);
    res.status(500).json({ error: error.message });
  }
});
