const model = require("../models/DRDB");
const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");
const config = require("../../config/general");

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  const { AgeGroups, PrerequisiteIds, ExclusionIds, User, ...newStudyInfo } = req.body;

  try {
    const created = await model.study.create(
      { ...newStudyInfo, AgeGroups: AgeGroups || [] },
      { include: [{ model: model.studyAgeGroup, as: "AgeGroups" }] }
    );

    if (PrerequisiteIds && PrerequisiteIds.length > 0) {
      await created.setPrerequisites(PrerequisiteIds);
    }
    if (ExclusionIds && ExclusionIds.length > 0) {
      await created.setExclusions(ExclusionIds);
    }

    const study = await model.study.findOne({
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
  const { id, AgeGroups, PrerequisiteIds, ExclusionIds, User, ...updatedStudyInfo } = req.body;

  try {
    await model.study.update(updatedStudyInfo, {
      where: { id: ID },
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
    const User = JSON.parse(req.query.User);

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
  const studyID = req.query.studyID;

  try {
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
        Personnel.Name as RecruitedBy, 
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
      GROUP BY ScheduledBy, Schedule.Status 
      ORDER BY Personnel.id;
    `;

    const queryStringNPriExp = `
      SELECT 
        Study.StudyName, 
        Experimenter.Name as Experimenter, 
        'Primary' as ROLE,  
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      JOIN ExperimenterAssignment ON Appointment.id = ExperimenterAssignment.FK_Appointment 
      JOIN Personnel AS Experimenter ON ExperimenterAssignment.FK_Experimenter = Experimenter.id 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Personnel ON Schedule.ScheduledBy = Personnel.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
        AND Schedule.Status = 'Confirmed'  
      GROUP BY Experimenter.Name, Experimenter.id, Schedule.Status 
      ORDER BY Experimenter.id;
    `;

    const queryStringNAssistExp = `
      SELECT 
        Study.StudyName, 
        Experimenter.Name as Experimenter,  
        'Assistant' as ROLE,   
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants 
      FROM Appointment 
      INNER JOIN ExperimenterAssignment ON Appointment.id = ExperimenterAssignment.FK_Appointment 
      INNER JOIN Personnel AS PrimaryExperimenter ON ExperimenterAssignment.FK_Experimenter = PrimaryExperimenter.id 
      INNER JOIN SecondExperimenterAssignment ON Appointment.id = SecondExperimenterAssignment.FK_Appointment 
      INNER JOIN Personnel AS Experimenter ON SecondExperimenterAssignment.FK_Experimenter = Experimenter.id 
      INNER JOIN Schedule ON Appointment.FK_Schedule = Schedule.id 
      INNER JOIN Personnel ON Schedule.ScheduledBy = Personnel.id 
      INNER JOIN Study ON Appointment.FK_Study = Study.id 
      INNER JOIN Lab ON Study.FK_Lab = Lab.id 
      INNER JOIN Family ON Schedule.FK_Family = Family.id 
      WHERE Study.id = :studyID 
        AND Family.TrainingSet = 0 
        AND Schedule.Status = 'Confirmed'  
      GROUP BY Experimenter.id, Experimenter.Name, Schedule.Status 
      ORDER BY Experimenter.id;
    `;

    const queryStringNWeeklyRecrtuiment = `
      SELECT 
        YEAR(Schedule.updatedAt) AS Year, 
        Schedule.Status AS Status, 
        COUNT(DISTINCT Appointment.id) AS NumberOfParticipants, 
        DATE_FORMAT(DATE_SUB(Schedule.updatedAt, INTERVAL WEEKDAY(Schedule.updatedAt) DAY), '%Y-%m-%d') AS WeekStartDate 
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

    // Safely execute queries with parameter binding
    const options = { replacements: { studyID }, type: QueryTypes.SELECT };

    const totalNperStatus = await model.sequelize.query(queryStringN, options);
    const totalNperPersonnelStatus = await model.sequelize.query(queryStringNperPersonnel, options);
    const totalNperPersonnelPriExp = await model.sequelize.query(queryStringNPriExp, options);
    const totalNperPersonnelAssistExp = await model.sequelize.query(queryStringNAssistExp, options);
    const totalNWeeklyRecrtuiment = await model.sequelize.query(queryStringNWeeklyRecrtuiment, options);

    // QueryTypes.SELECT returns data directly without the metadata wrapper
    res.status(200).send({ 
      totalNperStatus, 
      totalNperPersonnelStatus, 
      totalNperPersonnelPriExp, 
      totalNperPersonnelAssistExp, 
      totalNWeeklyRecrtuiment 
    });
  } catch (error) {
    console.error("Study stats error:", error);
    res.status(500).json({ error: error.message });
  }
});