const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");

// Create and Save a new study
exports.create = asyncHandler(async (req, res) => {
  var newStudyInfo = req.body;

  try {
    const study = await model.study.create(newStudyInfo);

    // Log
    const User = req.body.User;

    await log.createLog("Study Created", User, "created a study (" + study.StudyName + ")");

    res.status(200).send(study);
  } catch (error) {
    throw error
    // res.status(500).send(error);
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
          as: 'PointofContact'
        },
        {
          model: model.personnel,
          as: 'Experimenters',
          through: {
            model: model.experimenter,
          },
        },
      ],
    });

    console.log("Search successful!");

    res.status(200).send(study);
  } catch (error) {
    throw error
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
          as: 'PointofContact'
        },
        {
          model: model.personnel,
          as: 'Experimenters',
          through: {
            model: model.experimenter,
          },
        },
      ],
    });

    // Log
    const User = req.body.User;

    await log.createLog("Study Updated", User, "update a study's information (" + updatedStudyInfo.StudyName + ")");

    res.status(200).send(study);
  } catch (error) {
    throw error
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

    await log.createLog("Study Deleted", User, "deleted a study (" + req.query.id + ")");

    res.status(200).json(study);
  } catch (error) {
    throw error
  }
});
