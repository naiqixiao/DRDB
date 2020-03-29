const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");


exports.create = asyncHandler(async (req, res) => {
  const experimenter = req.body.experimenter;
  const studies = req.body.studies;

  studies.forEach(study => {
    study.FK_Experimenter = experimenter;
  });

  await model.experimenter.destroy({
    where: { FK_Experimenter: experimenter }
  });
  const assignedStudies = await model.experimenter.bulkCreate(studies);

  res.status(200).send(assignedStudies);
});