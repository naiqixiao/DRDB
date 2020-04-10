const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  var newStudyInfo = req.body;

  try {
    const study = await model.study.create(newStudyInfo);
    console.log("Study created: " + study.id);
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

  await model.study.update(updatedStudyInfo, {
    where: { id: ID },
  });

  const study = await model.study.findOne({
    where: { id: ID },
  });

  console.log("Study Information Updated!");
  res.status(200).send(study);
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const study = await model.study.destroy({
    where: req.query,
  });

  res.status(200).json(study);
});
