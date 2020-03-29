const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// Create and Save a new family
exports.create = asyncHandler(async (req, res) => {
  var newLabInfo = req.body;

  const lab = await model.lab.create(newLabInfo, {
    include: [model.study, model.personnel]
  });

  res.status(200).send(lab);
  console.log("lab created " + lab.id);
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
    include: [model.study, model.personnel]
  });

  res.status(200).send(lab);
  console.log("Search successful!");
});

// Update a Lab by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.query.id;
  var updatedLabInfo = req.body;

  if (updatedLabInfo.id) {
    delete updatedLabInfo["id"];
  }

  const lab = await model.lab.update(updatedLabInfo, {
    where: { id: ID },
    include: [model.study, model.personnel]
  });

  res.status(200).send(lab);
  console.log("lab Information Updated!");
});

// Delete a Lab with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const lab = await model.lab.destroy({
    where: req.query
  });

  res.status(200).json(lab);
});
