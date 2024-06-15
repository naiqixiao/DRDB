const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");
const config = require("../../config/general");

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  var newStudyInfo = req.body;

  try {
    const study = await model.study.create(newStudyInfo);

    // Log
    const User = req.body.User;

    await log.createLog(
      "Study Created",
      User,
      "created a study (" + study.StudyName + ")"
    );

    res.status(200).send(study);
  } catch (error) {
    throw error;
    // res.status(500).send(error);
  }
});

// Retrieve all studies from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = req.query;

  includeScheules = queryString.includeScheules;
  delete queryString.includeScheules;

  try {
    let study = [];

    if (includeScheules === "true") {
      study = await model.study.findAll({
        where: queryString,
        include: [
          { model: model.appointment, separate: true },
          model.lab,
          {
            model: model.personnel,
            as: "PointofContact",
          },
          {
            model: model.personnel,
            as: "Experimenters",
            through: {
              model: model.experimenter,
            },
          },
        ],
      });
    } else {
      study = await model.study.findAll({
        where: queryString,
        include: [
          model.lab,
          {
            model: model.personnel,
            as: "PointofContact",
          },
          {
            model: model.personnel,
            as: "Experimenters",
            through: {
              model: model.experimenter,
            },
          },
        ],
      });
    }

    console.log("Search successful!");

    res.status(200).send(study);
  } catch (error) {
    throw error;
  }
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedStudyInfo = req.body;

  if (updatedStudyInfo.id) {
    delete updatedStudyInfo["id"];
  }

  try {
    await model.study.update(updatedStudyInfo, {
      where: { id: ID },
    });

    const study = await model.study.findOne({
      where: { id: ID },
      include: [
        model.appointment,
        model.lab,
        {
          model: model.personnel,
          as: "PointofContact",
        },
        {
          model: model.personnel,
          as: "Experimenters",
          through: {
            model: model.experimenter,
          },
        },
      ],
    });

    // Log
    const User = req.body.User;

    await log.createLog(
      "Study Updated",
      User,
      "update a study's information (" + updatedStudyInfo.StudyName + ")"
    );

    res.status(200).send(study);
  } catch (error) {
    throw error;
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
    throw error;
  }
});


// Retrieve study progress infomation from the database.
exports.studyStats = asyncHandler(async (req, res) => {

  var studyID = req.query.studyID;

  try {
    var queryStringN = "SELECT     ${{DBName}}.Study.StudyName,     ${{DBName}}.Schedule.Status,     COUNT(DISTINCT ${{DBName}}.Appointment.id) AS NumberOfParticipants FROM     ${{DBName}}.Appointment     INNER JOIN ${{DBName}}.Schedule ON ${{DBName}}.Appointment.FK_Schedule = ${{DBName}}.Schedule.id     INNER JOIN ${{DBName}}.Personnel ON ${{DBName}}.Schedule.ScheduledBy = ${{DBName}}.Personnel.id     INNER JOIN ${{DBName}}.Study ON ${{DBName}}.Appointment.FK_Study = ${{DBName}}.Study.id     INNER JOIN ${{DBName}}.Lab ON ${{DBName}}.Study.FK_Lab = ${{DBName}}.Lab.id     INNER JOIN ${{DBName}}.Family ON ${{DBName}}.Schedule.FK_Family = ${{DBName}}.Family.id WHERE     ${{DBName}}.Study.id = ${{studyID}}     AND ${{DBName}}.Family.TrainingSet = 0 GROUP BY ${{DBName}}.Schedule.Status;";

    queryStringN = queryStringN.replace(/\${{DBName}}/g, config.DBName);
    queryStringN = queryStringN.replace(/\${{studyID}}/g, studyID);

    var queryStringNperPersonnel = "SELECT     ${{DBName}}.Study.StudyName,     ${{DBName}}.Personnel.Name as RecruitedBy,     ${{DBName}}.Schedule.Status,     COUNT(DISTINCT ${{DBName}}.Appointment.id) AS NumberOfParticipants FROM     ${{DBName}}.Appointment     INNER JOIN ${{DBName}}.Schedule ON ${{DBName}}.Appointment.FK_Schedule = ${{DBName}}.Schedule.id     INNER JOIN ${{DBName}}.Personnel ON ${{DBName}}.Schedule.ScheduledBy = ${{DBName}}.Personnel.id     INNER JOIN ${{DBName}}.Study ON ${{DBName}}.Appointment.FK_Study = ${{DBName}}.Study.id     INNER JOIN ${{DBName}}.Lab ON ${{DBName}}.Study.FK_Lab = ${{DBName}}.Lab.id     INNER JOIN ${{DBName}}.Family ON ${{DBName}}.Schedule.FK_Family = ${{DBName}}.Family.id WHERE     ${{DBName}}.Study.id = ${{studyID}}     AND ${{DBName}}.Family.TrainingSet = 0 GROUP BY ScheduledBy,     ${{DBName}}.Schedule.Status ORDER BY ${{DBName}}.Personnel.id;";

    queryStringNperPersonnel = queryStringNperPersonnel.replace(/\${{DBName}}/g, config.DBName);
    queryStringNperPersonnel = queryStringNperPersonnel.replace(/\${{studyID}}/g, studyID);

    var queryStringNPriExp = "SELECT     ${{DBName}}.Study.StudyName,     Experimenter.Name as Experimenter,   'Primary' as ROLE,  COUNT(DISTINCT ${{DBName}}.Appointment.id) AS NumberOfParticipants FROM     ${{DBName}}.Appointment     JOIN ${{DBName}}.ExperimenterAssignment ON ${{DBName}}.Appointment.id = ${{DBName}}.ExperimenterAssignment.FK_Appointment     JOIN ${{DBName}}.Personnel AS Experimenter ON ${{DBName}}.ExperimenterAssignment.FK_Experimenter = Experimenter.id     INNER JOIN ${{DBName}}.Schedule ON ${{DBName}}.Appointment.FK_Schedule = ${{DBName}}.Schedule.id     INNER JOIN ${{DBName}}.Personnel ON ${{DBName}}.Schedule.ScheduledBy = ${{DBName}}.Personnel.id     INNER JOIN ${{DBName}}.Study ON ${{DBName}}.Appointment.FK_Study = ${{DBName}}.Study.id     INNER JOIN ${{DBName}}.Lab ON ${{DBName}}.Study.FK_Lab = ${{DBName}}.Lab.id     INNER JOIN ${{DBName}}.Family ON ${{DBName}}.Schedule.FK_Family = ${{DBName}}.Family.id WHERE     ${{DBName}}.Study.id = ${{studyID}}     AND ${{DBName}}.Family.TrainingSet = 0     AND ${{DBName}}.Schedule.Status = 'Confirmed'  GROUP BY     Experimenter.Name,  Experimenter.id,   ${{DBName}}.Schedule.Status ORDER BY Experimenter.id;";

    queryStringNPriExp = queryStringNPriExp.replace(/\${{DBName}}/g, config.DBName);
    queryStringNPriExp = queryStringNPriExp.replace(/\${{studyID}}/g, studyID);

    var queryStringNAssistExp = "SELECT     ${{DBName}}.Study.StudyName,     Experimenter.Name as Experimenter,  'Assistant' as ROLE,   COUNT(DISTINCT ${{DBName}}.Appointment.id) AS NumberOfParticipants FROM     ${{DBName}}.Appointment     INNER JOIN ${{DBName}}.ExperimenterAssignment ON ${{DBName}}.Appointment.id = ${{DBName}}.ExperimenterAssignment.FK_Appointment     INNER JOIN ${{DBName}}.Personnel AS PrimaryExperimenter ON ${{DBName}}.ExperimenterAssignment.FK_Experimenter = PrimaryExperimenter.id     INNER JOIN ${{DBName}}.SecondExperimenterAssignment ON ${{DBName}}.Appointment.id = ${{DBName}}.SecondExperimenterAssignment.FK_Appointment     INNER JOIN ${{DBName}}.Personnel AS Experimenter ON ${{DBName}}.SecondExperimenterAssignment.FK_Experimenter = Experimenter.id     INNER JOIN ${{DBName}}.Schedule ON ${{DBName}}.Appointment.FK_Schedule = ${{DBName}}.Schedule.id     INNER JOIN ${{DBName}}.Personnel ON ${{DBName}}.Schedule.ScheduledBy = ${{DBName}}.Personnel.id     INNER JOIN ${{DBName}}.Study ON ${{DBName}}.Appointment.FK_Study = ${{DBName}}.Study.id     INNER JOIN ${{DBName}}.Lab ON ${{DBName}}.Study.FK_Lab = ${{DBName}}.Lab.id     INNER JOIN ${{DBName}}.Family ON ${{DBName}}.Schedule.FK_Family = ${{DBName}}.Family.id WHERE     ${{DBName}}.Study.id = ${{studyID}}     AND ${{DBName}}.Family.TrainingSet = 0     AND ${{DBName}}.Schedule.Status = 'Confirmed'  GROUP BY   Experimenter.id,  Experimenter.Name,     ${{DBName}}.Schedule.Status ORDER BY Experimenter.id;";

    queryStringNAssistExp = queryStringNAssistExp.replace(/\${{DBName}}/g, config.DBName);
    queryStringNAssistExp = queryStringNAssistExp.replace(/\${{studyID}}/g, studyID);


    var queryStringNWeeklyRecrtuiment = "SELECT     YEAR(${{DBName}}.Schedule.updatedAt) AS Year,     ${{DBName}}.Schedule.Status AS Status,     COUNT(DISTINCT ${{DBName}}.Appointment.id) AS NumberOfParticipants,     DATE_FORMAT( DATE_SUB( ${{DBName}}.Schedule.updatedAt,  interval WEEKDAY(${{DBName}}.Schedule.updatedAt) DAY  ), '%Y-%m-%d' ) AS WeekStartDate FROM     ${{DBName}}.Appointment     INNER JOIN ${{DBName}}.Schedule ON ${{DBName}}.Appointment.FK_Schedule = ${{DBName}}.Schedule.id     INNER JOIN ${{DBName}}.Study ON ${{DBName}}.Appointment.FK_Study = ${{DBName}}.Study.id     INNER JOIN ${{DBName}}.Lab ON ${{DBName}}.Study.FK_Lab = ${{DBName}}.Lab.id     INNER JOIN ${{DBName}}.Family ON ${{DBName}}.Schedule.FK_Family = ${{DBName}}.Family.id WHERE     ${{DBName}}.Schedule.createdAt > '2021-01-01'     AND ${{DBName}}.Study.id = ${{studyID}}     AND ${{DBName}}.Family.TrainingSet = 0 GROUP BY     Year,  WeekStartDate,   Status, WeekStartDate ORDER BY     Year,  WeekStartDate ;";

    queryStringNWeeklyRecrtuiment = queryStringNWeeklyRecrtuiment.replace(/\${{DBName}}/g, config.DBName);
    queryStringNWeeklyRecrtuiment = queryStringNWeeklyRecrtuiment.replace(/\${{studyID}}/g, studyID);


    const totalNperStatus = await model.sequelize.query(queryStringN);
    const totalNperPersonnelStatus = await model.sequelize.query(queryStringNperPersonnel);
    const totalNperPersonnelPriExp = await model.sequelize.query(queryStringNPriExp);
    const totalNperPersonnelAssistExp = await model.sequelize.query(queryStringNAssistExp);
    const totalNWeeklyRecrtuiment = await model.sequelize.query(queryStringNWeeklyRecrtuiment);

    const results = { totalNperStatus: totalNperStatus[0], totalNperPersonnelStatus: totalNperPersonnelStatus[0], totalNperPersonnelPriExp: totalNperPersonnelPriExp[0], totalNperPersonnelAssistExp: totalNperPersonnelAssistExp[0], totalNWeeklyRecrtuiment: totalNWeeklyRecrtuiment[0] };

    res.status(200).send(results);
  } catch (err) {
    console.error('Error getting file:', err);
  }
});