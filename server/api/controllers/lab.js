const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const log = require("../controllers/log");
const labService = require("../services/labService");

// Create and Save a new lab
exports.create = asyncHandler(async (req, res) => {
  const newLabInfo = req.body;
  const User = req.body.User;

  // Delegate all business logic to the service layer
  const lab = await labService.createLab(newLabInfo);

  // Log the action
  await log.createLog(
    "Lab Created",
    User,
    "created a lab (" + newLabInfo.LabName + ")"
  );

  res.status(200).send("a new lab is created.");
});

// Retrieve all lab from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};
  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.LabName) {
    queryString.LabName = { [Op.like]: `${req.query.LabName}%` };
  }
  if (req.query.PI) {
    queryString.PI = { [Op.like]: `${req.query.PI}%` };
  }

  const lab = await model.lab.findAll({
    where: queryString,
    include: [model.study, model.personnel],
  });

  res.status(200).send(lab);
  console.log("Search successful!");
});

// Update a Lab by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var updatedLabInfo = req.body;

  const lab = await model.lab.update(updatedLabInfo, {
    where: { id: updatedLabInfo.lab },
  });

  // Log
  const User = req.body.User;

  await log.createLog(
    "Lab Updated",
    User,
    "updated lab information (" + updatedLabInfo.LabName + ")"
  );

  res.status(200).send(lab);
  console.log("Lab Information Updated!");
});

// Delete a Lab with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  // delete a folder to store credentials
  const labFolderPath = "api/google/labs/lab" + req.query.lab;

  if (fs.existsSync(labFolderPath)) {
    if (fs.existsSync(labFolderPath + "/token.json")) {
      fs.unlinkSync(labFolderPath + "/token.json");
    }
    fs.rmdirSync(labFolderPath);
  }

  const lab = await model.lab.destroy({
    where: { id: req.query.id },
  });

  // Log
  const User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;

  await log.createLog(
    "Lab Deleted",
    User,
    "deleted lab (" + req.query.id + ") from the database"
  );

  res.status(200).json(lab);
  console.log("Lab removal succeeds.");
});
