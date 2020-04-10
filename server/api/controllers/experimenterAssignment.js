const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = req.body;

  await model.experimenterAssignment.destroy({
    where: { FK_Appointment: appointment[0].FK_Appointment }
  });

  const assignedStudies = await model.experimenterAssignment.bulkCreate(appointment);

  res.status(200).send(assignedStudies);
});
