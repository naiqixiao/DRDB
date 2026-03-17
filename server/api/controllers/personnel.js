const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const log = require("../controllers/log");

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

  res.status(200).send(personnel);
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

  await log.createLog("Personnel Updated", User, "update personnel information (" +
    personnel.Name + ")");

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
  const User = JSON.parse(req.query.User);

  await log.createLog("Personnel Deleted", User, "removed (" +
  req.query.id + ") from the database");

  res.status(200).json(personnel);
  console.log(personnel.id + " deleted.");
});

// ─── GET PERSONNEL STATS ─────────────────────────────────────────────
// Retrieve all-time KPI stats (E1, E2, and Recruiting totals) for a specific user
exports.getStats = asyncHandler(async (req, res) => {
  const personnelId = req.query.id;

  if (!personnelId) {
    return res.status(400).json({ error: "Personnel ID is required." });
  }

  try {
    // 1. Count how many times they were E1
    const e1Count = await model.experimenterAssignment.count({
      where: { FK_Experimenter: personnelId }
    });

    // 2. Count how many times they were E2
    const e2Count = await model.experimenterAssignment_2nd.count({
      where: { FK_Experimenter: personnelId }
    });

    // 3. Count how many schedules they created (Recruited)
    const scheduledCount = await model.schedule.count({
      where: { ScheduledBy: personnelId }
    });

    res.status(200).json({
      e1Count,
      e2Count,
      scheduledCount
    });
  } catch (error) {
    console.error("Failed to fetch personnel stats:", error);
    res.status(500).json({ error: "Failed to fetch personnel stats." });
  }
});

