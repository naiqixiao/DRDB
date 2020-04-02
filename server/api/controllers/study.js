const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// Create and Save a new family
exports.create = asyncHandler(async (req, res) => {
  var newStudyInfo = req.body;

  const study = await model.study.create(newStudyInfo, {
    include: [model.appointment, model.lab]
  });

  console.log("Study created " + study.id);
  res.status(200).send(study);
});

// Retrieve all families from the database.
exports.search = asyncHandler(async (req, res) => {
  var ID = req.query.id;

  try {
    const study = await model.study.findOne({
      where: { id: ID },
      include: [model.appointment, model.lab]
    });

    console.log("Search successful!");

    res.status(200).send(study);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.query.id;
  var updatedStudyInfo = req.body;

  if (updatedStudyInfo.id) {
    delete updatedStudyInfo["id"];
  }

  const study = await model.study.update(updatedStudyInfo, {
    where: { id: ID },
    include: [model.appointment, model.lab]
  });

  console.log("Study Information Updated!");
  res.status(200).send(study);
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const study = await model.study.destroy({
    where: req.query
  });

  res.status(200).json(study);
});
