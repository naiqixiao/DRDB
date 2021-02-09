const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");

exports.updateExperimenters = asyncHandler(async (req, res) => {
  const experimenters = req.body.experimenters;

  try {
    await model.experimenter.destroy({
      where: { FK_Study: experimenters[0].FK_Study }
    });

    const assignedStudies = await model.experimenter.bulkCreate(experimenters);

    // Log
    const User = req.body.User;

    await log.createLog("Experimenter Assignment Updated", User, "updated experimenter assignment for a study (" +
      experimenters[0].FK_Study + ")");

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
    await log.createLog("Experimenter Assignment Updated", User, "updated experimenter assignment for an experimenter (" +
      studies[0].FK_Experimenter + ")");

    res.status(200).send(assignedStudies);
  } catch (error) {
    res.status(500).send(error);
  }
});