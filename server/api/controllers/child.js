const model = require("../models/DRDB");
const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const moment = require("moment");
const log = require("../controllers/log");

const config = require("../../config/general");

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

    child.IdWithinFamily = IdWithinFamily;

    // Log
    const User = req.body.User;
    await log.createLog("Child Created", User, "added a child to a family (" +
      child.FK_Family +
      ")");

    res.status(200).send(child);

    console.log("Child is created and siblings are updated!");
  } catch (error) {
    throw error;
  }
});

// batch upload children
exports.batchCreate = asyncHandler(async (req, res) => {
  try {
    var newChildrenInfo = req.body;

    const alphabet = "abcdefghijk".split("");

    const newChildren = await model.child.bulkCreate(newChildrenInfo);

    // update sibbling table & assign child id within each family
    for (var i = 0; i < newChildren.length; i++) {
      if (newChildren.length > 1) {
        var Children = await model.child.findAll({
          attributes: ["id"],
          where: { FK_Family: newChildren[i].FK_Family },
        });

        var siblings = [];

        for (var j = 0; j < Children.length; j++) {
          var childId = Children[j].id;

          // Children.forEach((sibling) => {
          //   if (sibling.id != childId) {
          //     siblings.push({ FK_Child: childId, Sibling: sibling.id });
          //   }
          // });

          // assign child id within each family
          // Children[j].IdWithinFamily = alphabet[j];

          await model.child.update(
            { IdWithinFamily: alphabet[j] },
            {
              where: { id: Children[j].id },
            }
          );
        }

        await model.sibling.bulkCreate(siblings);
      }
    }

    res.status(200).send(newChildren);
  } catch (error) {
    throw error;
  }
});

// Retrieve all children from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  if (req.query.Email) {
    queryString["$Family.Email$"] = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NamePrimary) {
    queryString["$Family.NamePrimary$"] = {
      [Op.like]: `${req.query.NamePrimary}%`,
    };
  }
  if (req.query.NameSecondary) {
    queryString["$Family.NameSecondary$"] = {
      [Op.like]: `${req.query.NameSecondary}%`,
    };
  }
  if (req.query.Phone) {
    queryString["$Family.Phone$"] = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.FamilyId) {
    queryString.FK_Family = req.query.FamilyId;
  }

  queryString["$Family.NextContactDate$"] = {
    [Op.or]: [
      {
        [Op.lte]: moment()
          .startOf("day")
          .toDate(),
      },
      { [Op.eq]: null },
    ],
  };

  queryString["$Family.NoMoreContact$"] = 0;

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.minAge && req.query.maxAge) {
    queryString.Age = {
      [Op.between]: [req.query.minAge * 30.5 - 1, req.query.maxAge * 30.5 - 1],
    };
  }

  if (req.query.PrematureParticipant != null) {
    queryString.PrematureBirth = req.query.PrematureParticipant;
  }

  if (req.query.IllParticipant != null) {
    queryString.Illness = req.query.IllParticipant;
  }

  if (req.query.VisionLossParticipant != null) {
    queryString.VisionLoss = req.query.VisionLossParticipant;
  }

  if (req.query.HearingLossParticipant != null) {
    queryString.HearingLoss = req.query.HearingLossParticipant;
  }

  if (req.query.ASDParticipant != null) {
    queryString["$Family.AutismHistory$"] = req.query.ASDParticipant;
  }

  if (req.query.studyID) {

    const studyInfo = await model.study.findOne({
      where: { id: req.query.studyID }, include: [
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

    const pastParticipants = studyInfo.Appointments.map(
      (appointment) => {
        return appointment.FK_Child;
      }
    );

    queryString.id = { [Op.notIn]: pastParticipants };
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
            include: [{ model: model.appointment, attributes: ["FK_Study"] }, {
              model: model.family,
              attributes: ['AutismHistory']
            }],
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
                  "ReminderTemplate",
                  "FollowUPEmailSnippet",
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
        include: [{ model: model.appointment, include: [model.schedule] }, { model: model.family }],
      },
    ],
    order: [[model.family, model.appointment, "id", "DESC"]],
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

  await log.createLog("Child Updated", User, "updated a child's information (" + ID + ")");

  res.status(200).json(child);
});

// Delete a child with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const child = await model.child.destroy({
    where: { id: req.query.id },
  });

  // Log
  const User = JSON.parse(req.query.User);

  await log.createLog("Child Deleted", User, "deleted a child (" + req.query.id + ")");

  res.status(200).json(child);
});

// Update a sibling table
exports.siblings = asyncHandler(async (req, res) => {

  var queryString = "Select `s`.`id` as FK_Child, `c`.`id` as Sibling from ${{DBName}}.Child c inner join ${{DBName}}.Child s on c.FK_Family  = s.FK_Family where c.IdWithinFamily <> s.IdWithinFamily "
  queryString = queryString.replace(/\${{DBName}}/g, config.DBName);

  const siblings = await model.sequelize.query(
    queryString,
    { type: QueryTypes.SELECT }
  );

  const results = await model.sibling.bulkCreate(siblings);

  res.status(200).json(results);
});

// update Age
exports.updateAge = asyncHandler(async (req, res) => {

  var queryString = "UPDATE ${{DBName}}.Child Set Age = DATEDIFF(CURDATE(), DoB);";
  queryString = queryString.replace(/\${{DBName}}/g, config.DBName);

  try {

    await model.sequelize.query(queryString);

    await log.createLog("Age Updated", {}, "Children's age is updated");

  } catch (error) {
    throw error;
  }
})
