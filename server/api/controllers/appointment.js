const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// {
//             "FK_Schedule": 35,
//             "FK_Study": 3,
//             "FK_Family": 208,
//             "FK_Child": 415
//         }

// add an appointment (child, family, & study) to an existing schedule.
exports.create = asyncHandler(async (req, res) => {
  var newAppointmentInfo = req.body;

  try {
    const appointments = await model.appointment.bulkCreate(newAppointmentInfo);

    res.status(200).send(appointments);
  } catch (error) {
    throw error;
  }
});

// Retrieve appointments from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.StudyId) {
    queryString.FK_Study = req.query.StudyId;
  }
  if (req.query.FamilyId) {
    queryString.FK_Family = req.query.FamilyId;
  }
  if (req.query.ChildId) {
    queryString.FK_Child = { [Op.in]: req.query.ChildId };
  }

  if (req.query.Email) {
    queryString["$Family.Email$"] = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NameMom) {
    queryString["$Family.NameMom$"] = { [Op.like]: `${req.query.NameMom}%` };
  }
  if (req.query.NameDad) {
    queryString["$Family.NameDad$"] = { [Op.like]: `${req.query.NameDad}%` };
  }
  if (req.query.Phone) {
    queryString["$Family.Phone$"] = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.ChildName) {
    queryString["$Child.Name$"] = { [Op.like]: `${req.query.ChildName}%` };
  }
  if (req.query.StudyName) {
    queryString["$Study.StudyName$"] = { [Op.like]: `${req.query.StudyName}%` };
  }

  const appointment = await model.appointment.findAll({
    where: queryString,
    include: [
      { model: model.family, attributes: ["id"] },
      { model: model.child, attributes: ["Name", "DoB"] },
      { model: model.study, attributes: ["StudyName", "MinAge", "MaxAge"] },
      {
        model: model.personnel,
        through: { model: model.experimenterAssignment },
        attributes: ['id', 'Name', 'Email', 'Calendar']
      },
    ],
  });
  res.status(200).send(appointment);
  console.log("Search successful!");
});

// Update an appointment by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var updatedAppointmentInfo = req.body;

  if (updatedAppointmentInfo.id) {
    var ID = updatedAppointmentInfo.id;
    delete updatedAppointmentInfo["id"];
  }

  try {
    const updatedAppointment = await model.appointment.update(
      updatedAppointmentInfo,
      {
        where: { id: ID },
      }
    );

    res.status(200).send(updatedAppointment);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error:" + error);
  }
});

// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  await model.appointment.destroy({
    where: req.query,
  });

  res.status(200).send("appointment deleted.");
});
