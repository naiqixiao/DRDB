const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = req.body;

  await model.experimenterAssignment_2nd.destroy({
    where: { FK_Appointment: appointment[0].FK_Appointment }
  });

  const assignedStudies = await model.experimenterAssignment_2nd.bulkCreate(appointment);

  res.status(200).send(assignedStudies);
});
