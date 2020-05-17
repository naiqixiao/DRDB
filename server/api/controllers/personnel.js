const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// Create and Save a new personnel
exports.create = asyncHandler(async (req, res) => {
  var newPersonnelInfo = req.body;
  const personnel = await model.personnel.create(newPersonnelInfo);

  res.status(200).send(personnel);
  console.log("personnel created " + personnel.id);
});

// Retrieve all personnel from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.Email) {
    queryString.Email = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.Name) {
    queryString.Name = { [Op.like]: `${req.query.Name}%` };
  }
  if (req.query.Initial) {
    queryString.Initial = { [Op.like]: `${req.query.Initial}%` };
  }
  if (req.query.Phone) {
    queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.Role) {
    queryString.Role = { [Op.in]: `${req.query.Role}%` };
  }
  if (req.query.Active) {
    queryString.Active = req.query.Active;
  }

  if (req.query.lab) {
    queryString.FK_Lab = req.query.lab;
  }
  if (req.query.study) {
    queryString["$Studies.id$"] = req.query.study;
  }

  // console.log(queryString)
  const personnel = await model.personnel.findAll({
    where: queryString,
    include: [
      model.lab,
      // model.appointment,
      {
        model: model.study,
        attributes: ["id", "StudyName", "MinAge", "MaxAge", "StudyType", "Completed"],
        through: {
          model: model.experimenter,
        },
      },
    ],
  });

  return res.status(200).send(personnel);
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedPersonnelInfo = req.body;

  if (updatedPersonnelInfo.id) {
    delete updatedPersonnelInfo["id"];
  }

  await model.personnel.update(updatedPersonnelInfo, {
    where: { id: ID },
  });

  const personnel = await model.personnel.findOne({
    where: { id: ID },
  });
  res.status(200).send(personnel);
  console.log("Personnel Information Updated!");
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const personnel = await model.personnel.destroy({
    where: req.query,
  });
  res.status(200).json(personnel);
  console.log(personnel.id + " deleted.");
});
