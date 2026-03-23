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
    await log.createLog(
      "Child Created",
      User,
      "added a child to a family (" + child.FK_Family + ")"
    );

    res.status(200).send(child);

    console.log("Child is created and siblings are updated!");
  } catch (error) {
    console.error("Child create error:", error);
    res.status(500).json({ error: error.message });
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
    console.error("Child batch create error:", error);
    res.status(500).json({ error: error.message });
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
  // Guard: require age range when searching by study to prevent massive unfiltered results
  if (req.query.studyID && (!req.query.minAge || !req.query.maxAge)) {
    return res.status(400).json({ error: "minAge and maxAge are required when searching by study." });
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
      where: { id: req.query.studyID },
      include: [
        model.appointment,
        model.lab,
        {
          model: model.personnel,
          as: "PointofContact",
        },
        {
          model: model.personnel,
          as: "Experimenters",
          through: {
            model: model.experimenter,
          },
        },
      ],
    });

    const pastParticipants = studyInfo.Appointments.map((appointment) => {
      return appointment.FK_Child;
    });

    queryString.id = { [Op.notIn]: pastParticipants };
  }

  const isSlim = req.query.slim === 'true';

  const children = await model.child.findAll({
    where: queryString,
    include: isSlim ? [
      // Slim mode: only what's needed for Schedule page list + client-side filtering
      {
        model: model.appointment,
        separate: true,
        attributes: ["id", "FK_Study", "FK_Schedule"],
      },
      {
        model: model.family,
        attributes: ["id", "NamePrimary", "NameSecondary", "Phone", "CellPhone", "Email",
                     "AutismHistory", "NextContactDate", "NoMoreContact", "Note",
                     "LanguagePrimary", "Address", "TrainingSet"],
      },
    ] : [
      // Full mode: all nested data (used by Family page and other callers)
      { model: model.appointment, separate: true, include: [model.schedule] },
      {
        model: model.family,
        include: [
          { model: model.conversations, separate: true },
          {
            model: model.child,
            separate: true,
            include: [
              { model: model.appointment, attributes: ["FK_Study"] },
              { model: model.family, attributes: ["AutismHistory"] },
            ],
          },
          {
            model: model.appointment,
            order: [["id", "DESC"]],
            separate: true,
            include: [
              { model: model.child, attributes: ["Name", "DoB"] },
              {
                model: model.study,
                attributes: ["StudyName", "EmailTemplate", "ReminderTemplate",
                             "FollowUPEmailSnippet", "StudyType", "FK_Lab"],
                include: [model.lab],
              },
              { model: model.schedule },
            ],
          },
        ],
      },
      {
        model: model.child,
        as: "sibling",
        through: { model: model.sibling },
        include: [
          { model: model.appointment, separate: true, include: [model.schedule] },
          { model: model.family },
        ],
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

  await log.createLog(
    "Child Updated",
    User,
    "updated a child's information (" + ID + ")"
  );

  res.status(200).json(child);
});

// Delete a child with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const child = await model.child.destroy({
    where: { id: req.query.id },
  });

  // req.query.User is already parsed by Express's qs parser into an object
  // when sent as User[Name]=...&User[Email]=..., so no JSON.parse needed
  const User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;

  await log.createLog(
    "Child Deleted",
    User,
    "deleted a child (" + req.query.id + ")"
  );

  res.status(200).json(child);
});

// Update a sibling table
exports.siblings = asyncHandler(async (req, res) => {
  var queryString =
    "Select `s`.`id` as FK_Child, `c`.`id` as Sibling from ${{DBName}}.Child c inner join ${{DBName}}.Child s on c.FK_Family  = s.FK_Family where c.IdWithinFamily <> s.IdWithinFamily ";
  queryString = queryString.replace(/\${{DBName}}/g, config.DBName);

  const siblings = await model.sequelize.query(queryString, {
    type: QueryTypes.SELECT,
  });

  const results = await model.sibling.bulkCreate(siblings);

  res.status(200).json(results);
});

// update Age
exports.updateAge = asyncHandler(async (req, res) => {
  var queryString =
    "UPDATE ${{DBName}}.Child Set Age = DATEDIFF(CURDATE(), DoB);";
  queryString = queryString.replace(/\${{DBName}}/g, config.DBName);

  await model.sequelize.query(queryString);
  await log.createLog("Age Updated", {}, "Children's age is updated");
});

// ─── Merge duplicate child records within a family ───────────────────────
// primaryChildId: the child record to keep
// secondaryChildIds: child records to merge into primary, then delete
exports.mergeChildren = asyncHandler(async (req, res) => {
  const { primaryChildId, secondaryChildIds, User } = req.body;

  if (!primaryChildId || !secondaryChildIds || secondaryChildIds.length === 0) {
    return res.status(400).json({ error: "Missing primaryChildId or secondaryChildIds." });
  }

  // 1. Validate: primary child must exist
  const primaryChild = await model.child.findOne({ where: { id: primaryChildId } });
  if (!primaryChild) {
    return res.status(404).json({ error: "Primary child not found." });
  }
  const familyId = primaryChild.FK_Family;

  // 2. Guard against cross-family merge: all secondary children must belong to the same family
  const secondaryChildren = await model.child.findAll({
    where: { id: { [Op.in]: secondaryChildIds } },
    attributes: ['id', 'FK_Family']
  });
  const crossFamily = secondaryChildren.some(c => c.FK_Family !== familyId);
  if (crossFamily) {
    return res.status(400).json({ error: "All children must belong to the same family." });
  }

  // 3. Wrap all mutations in a transaction
  await model.sequelize.transaction(async (t) => {
    const opts = { transaction: t };

    // Move all appointments from secondary children to the primary child
    await model.appointment.update(
      { FK_Child: primaryChildId },
      { where: { FK_Child: { [Op.in]: secondaryChildIds } }, ...opts }
    );

    // Delete the secondary child records (appointments already moved out)
    await model.child.destroy({ where: { id: { [Op.in]: secondaryChildIds } }, ...opts });

    // Re-letter all remaining children in the family by DoB (a, b, c…)
    const alphabet = "abcdefghijk".split("");
    const remainingChildren = await model.child.findAll({
      where: { FK_Family: familyId },
      order: [["DoB", "ASC"]],
      ...opts
    });
    for (let i = 0; i < remainingChildren.length; i++) {
      await model.child.update(
        { IdWithinFamily: alphabet[i] },
        { where: { id: remainingChildren[i].id }, ...opts }
      );
    }

    // Rebuild sibling table
    const childIds = remainingChildren.map((c) => c.id);
    await model.sibling.destroy({ where: { FK_Child: { [Op.in]: childIds } }, ...opts });
    await model.sibling.destroy({ where: { Sibling: { [Op.in]: childIds } }, ...opts });

    const siblingRows = [];
    for (let i = 0; i < childIds.length; i++) {
      for (let j = 0; j < childIds.length; j++) {
        if (i !== j) siblingRows.push({ FK_Child: childIds[i], Sibling: childIds[j] });
      }
    }
    if (siblingRows.length > 0) {
      await model.sibling.bulkCreate(siblingRows, { ignoreDuplicates: true, ...opts });
    }
  });

  // 4. Log outside transaction (non-blocking)
  try {
    await log.createLog(
      "Child Merged",
      User,
      `Merged children [${secondaryChildIds.join(", ")}] into Child (${primaryChildId}) in Family (${familyId})`
    );
  } catch (logErr) {
    console.error("Child merge log failed:", logErr.message);
  }

  res.status(200).json({ message: "Children successfully merged!", familyId });
});
