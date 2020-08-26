const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  var newStudyInfo = req.body;

  try {
    const study = await model.study.create(newStudyInfo);
    console.log("Study created: " + study.id);

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_login.txt";

    } else {
      var logFile = logFolder + "/login.txt";
    }

    var logInfo = "[Study Created] " + User.Name + " (" + User.Email + ") " + "created a study (" +
      study.id + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(study);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Retrieve all studies from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = req.query;

  try {
    const study = await model.study.findAll({
      where: queryString,
      include: [
        model.appointment,
        model.lab,
        {
          model: model.personnel,
          through: {
            model: model.experimenter,
          },
        },
      ],
    });

    console.log("Search successful!");

    res.status(200).send(study);
  } catch (error) {
    res.status(500).send(error);
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
    });

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_login.txt";

    } else {
      var logFile = logFolder + "/login.txt";
    }

    var logInfo = "[Study Updated] " + User.Name + " (" + User.Email + ") " + "update a study's information (" +
      ID + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(study);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {

  try {
    const study = await model.study.destroy({
      where: { id: req.query.id },
    });

    // Log
    var User = JSON.parse(req.query.User);

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_login.txt";

    } else {
      var logFile = logFolder + "/login.txt";
    }

    var logInfo = "[Study Deleted] " + User.Name + " (" + User.Email + ") " + "deleted a study (" +
      req.query.id + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).json(study);
  } catch (error) {
    res.status(500).send(error);
  }
});
