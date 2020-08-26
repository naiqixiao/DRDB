const model = require("../models/DRDB");
const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const moment = require('moment');

function shuffle(array) {
  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Create and Save a new child of an existing family
exports.create = asyncHandler(async (req, res) => {
  const newChildInfo = req.body;

  try {
    const child = await model.child.create(newChildInfo);

    // match siblings and update sibling table
    var Children = await model.child.findAll({
      attributes: ["id"],
      where: { FK_Family: child.FK_Family, id: { [Op.ne]: child.id } },
    });

    if (Children.length > 0) {
      var siblings = [];

      Children.forEach((sibling) => {
        siblings.push({ FK_Child: child.id, Sibling: sibling.id });
        siblings.push({ FK_Child: sibling.id, Sibling: child.id });
      });

      await model.sibling.bulkCreate(siblings);
    }

    // update child id within the family
    const alphabet = "abcdefghijk".split("");
    IdWithinFamily = alphabet[Children.length];

    await model.child.update(
      { IdWithinFamily: IdWithinFamily },
      {
        where: { id: child.id },
      }
    );

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    const logFile = logFolder + "/login.txt";

    var logInfo = "[Child Created] " + User.Name + " (" + User.Email + ") from " +
      User.LabName + " added a child to a family (" +
      child.FK_Family + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(child);

    console.log("Child is created and siblings are updated!");
  } catch (error) {
    res.status(500).send(error);
  }
});

// Retrieve all children from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

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
  if (req.query.FamilyId) {
    queryString.FK_Family = req.query.FamilyId;
  }

  queryString["$Family.NextContactDate$"] = { [Op.lte]: moment().startOf("day").toDate() };
  
  queryString["$Family.NoMoreContact$"] = 0;

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.minAge && req.query.maxAge) {
    queryString.Age = {
      [Op.between]: [req.query.minAge * 30.5 - 5, req.query.maxAge * 30.5 - 5],
    };
  }
  if (req.query.pastParticipants) {
    queryString.id = { [Op.notIn]: req.query.pastParticipants };
  }
  if (req.query.PrematureParticipant) {
    queryString.PrematureBirth = req.query.PrematureParticipant;
  }

  if (req.query.IllParticipant) {
    queryString.Illness = req.query.IllParticipant;
  }

  if (req.query.VisionLossParticipant) {
    queryString.VisionLoss = req.query.VisionLossParticipant;
  }

  if (req.query.HearingLossParticipant) {
    queryString.HearingLoss = req.query.HearingLossParticipant;
  }

  const children = await model.child.findAll({
    where: queryString,
    include: [
      { model: model.appointment, include: [model.schedule] },
      {
        model: model.family,
        include: [
          {
            model: model.conversations,
          },
          {
            model: model.child,
            include: [{ model: model.appointment, attributes: ["FK_Study"] }],
          },
          {
            model: model.appointment,
            include: [
              { model: model.child, attributes: ["Name", "DoB"] },
              {
                model: model.study,
                attributes: [
                  "StudyName",
                  "MinAge",
                  "MaxAge",
                  "EmailTemplate",
                  "StudyType",
                  "FK_Lab",
                ],
              },
              { model: model.schedule },
            ],
          },
        ],
      },
      {
        model: model.child,
        as: "sibling",
        through: {
          model: model.sibling,
        },
        include: [{ model: model.appointment, include: [model.schedule] }],
      },
    ],
  });

  shuffle(children);

  res.status(200).json(children);
});

// Update a child by the id in the request
exports.update = asyncHandler(async (req, res) => {
  const updatedChildInfo = req.body;

  if (updatedChildInfo.id) {
    var ID = updatedChildInfo.id;
    delete updatedChildInfo["id"];
  }

  const child = await model.child.update(updatedChildInfo, {
    where: { id: ID },
  });

  // Log
  const User = req.body.User;

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const logFile = logFolder + "/login.txt";

  var logInfo = "[Child Updated] " + User.Name + " (" + User.Email + ") from " +
    User.LabName + " updated a child's information (" +
    ID + ") at " +
    new Date().toString() + " - " + User.IP + "\r\n"

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).json(child);
});

// Delete a child with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const child = await model.child.destroy({
    where: req.query.id,
  });

  // Log
  var User = JSON.parse(req.query.User);

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const logFile = logFolder + "/login.txt";

  var logInfo = "[Child Deleted] " + User.Name + " (" + User.Email + ") from " +
    User.LabName + " deleted a child (" +
    req.query.id + ") from the database at " +
    new Date().toString() + " - " + User.IP + "\r\n"

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).json(child);
});

// Update a sibling table
exports.siblings = asyncHandler(async (req, res) => {
  const siblings = await model.sequelize.query(
    "Select `s`.`id` as FK_Child, `c`.`id` as Sibling from DRDB.Child c inner join DRDB.Child s on c.FK_Family  = s.FK_Family where c.Name <> s.Name ",
    { type: QueryTypes.SELECT }
  );

  const results = await model.sibling.bulkCreate(siblings);

  res.status(200).json(results);
});
