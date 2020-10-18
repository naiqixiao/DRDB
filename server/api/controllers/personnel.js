const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const bcrypt = require("bcrypt");

// Create and Save a new personnel
exports.create = asyncHandler(async (req, res) => {
  var newPersonnelInfo = req.body;
  const personnel = await model.personnel.create(newPersonnelInfo);

  res.status(200).send(personnel);
  console.log("personnel created " + personnel.id);
});

// Retrieve all personnel from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.Email) {
    queryString.Email = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.Name) {
    queryString.Name = { [Op.like]: `${req.query.Name}%` };
  }
  if (req.query.Initial) {
    queryString.Initial = { [Op.like]: `${req.query.Initial}%` };
  }
  if (req.query.Phone) {
    queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.Role) {
    queryString.Role = { [Op.in]: `${req.query.Role}%` };
  }
  if (req.query.Active) {
    queryString.Active = req.query.Active;
  }

  if (req.query.FK_Lab) {
    queryString.FK_Lab = req.query.FK_Lab;
  }

  if (req.query.study) {
    queryString["$AssignedStudies.id$"] = req.query.study;
  }

  queryString.Retired = false;

  // console.log(queryString)
  const personnel = await model.personnel.findAll({
    where: queryString,
    include: [
      model.lab,
      // model.appointment,
      {
        model: model.study,
        as: "AssignedStudies",
        through: {
          model: model.experimenter,
        },
      },
      {
        model: model.study,
        as: "StudyinCharge",
      },
    ],
  });

  return res.status(200).send(personnel);
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedPersonnelInfo = req.body;

  if (updatedPersonnelInfo.id) {
    delete updatedPersonnelInfo["id"];
  }

  await model.personnel.update(updatedPersonnelInfo, {
    where: { id: ID },
  });

  const personnel = await model.personnel.findOne({
    where: { id: ID },
  });

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

  var logInfo = "[Personnel Updated] " + User.Name + " (" + User.Email + ") " + "update personnel information (" +
    personnel.Name + ") at " +
    new Date().toString() + " - " + User.IP + "\r\n";

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).send(personnel);
  console.log("Personnel Information Updated!");
});

// Delete a personnel with the specified id in the request
// The personnel will not be destroied, but labelled with "retried" in the database.
exports.delete = asyncHandler(async (req, res) => {

  // reset password
  const password = Math.random()
    .toString(36)
    .substring(2);

  const hashPassword = bcrypt.hashSync(password, 10);

  const personnel = await model.personnel.update({
    Password: hashPassword,
    Retired: true,
    Active: false
  },
    {
      where: { id: req.query.id }
    });

  // removed the personnel from assigned study 
  await model.experimenter.destroy({
    where: { FK_Experimenter: req.query.id }
  })

  // Log
  var User = JSON.parse(req.query.User);

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  if (User.LabName) {
    var logFile = logFolder + "/" + User.LabName + "_log.txt";

  } else {
    var logFile = logFolder + "/log.txt";
  }

  var logInfo = "[Personnel Deleted] " + User.Name + " (" + User.Email + ") " + "removed (" +
    req.query.id + ") from the database at " +
    new Date().toString() + " - " + User.IP + "\r\n"

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).json(personnel);
  console.log(personnel.id + " deleted.");
});
