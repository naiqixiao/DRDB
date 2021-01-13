const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

exports.updateExperimenters = asyncHandler(async (req, res) => {
  const experimenters = req.body.experimenters;

  try {
    await model.experimenter.destroy({
      where: { FK_Study: experimenters[0].FK_Study }
    });

    const assignedStudies = await model.experimenter.bulkCreate(experimenters);

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Experimenter Assignment Updated] " + User.Name + " (" + User.Email + ") " +
      "updated experimenter assignment for a study (" +
      experimenters[0].FK_Study + ") at " +
      new Date().toString() + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(assignedStudies);
  } catch (error) {
    res.status(500).send(error);
  }
});

exports.updateStudies = asyncHandler(async (req, res) => {
  const studies = req.body.studies;
  try {
    await model.experimenter.destroy({
      where: { FK_Experimenter: studies[0].FK_Experimenter }
    });

    const assignedStudies = await model.experimenter.bulkCreate(studies);

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Experimenter Assignment Updated] " + User.Name + " (" + User.Email + ") " +
      "updated experimenter assignment for an experimenter (" +
      studies[0].FK_Experimenter + ") at " +
      new Date().toString() + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(assignedStudies);
  } catch (error) {
    res.status(500).send(error);
  }
});