const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");


exports.updateExperimenters = asyncHandler(async (req, res) => {
  const experimenters = req.body;

  await model.experimenter.destroy({
    where: { FK_Study: experimenters[0].FK_Study }
  });

  const assignedStudies = await model.experimenter.bulkCreate(experimenters);

  res.status(200).send(assignedStudies);
});

exports.updateStudies = asyncHandler(async (req, res) => {
  const studies = req.body;

  await model.experimenter.destroy({
    where: { FK_Experimenter: studies[0].FK_Experimenter }
  });

  const assignedStudies = await model.experimenter.bulkCreate(studies);

  res.status(200).send(assignedStudies);
});