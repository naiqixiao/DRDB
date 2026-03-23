const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const fs = require("fs");
const Sequelize = require("sequelize");

const log = require("../controllers/log");
const familyService = require("../services/familyService");

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

function containsObject(obj, array) {
  var i;
  for (i = 0; i < array.length; i++) {
    if (
      array[i].FK_Child === obj.FK_Child &&
      array[i].Sibling === obj.Sibling
    ) {
      return true;
    }
  }

  return false;
}

// Create and Save a new family

//   {
//     "NamePrimary": "Mom's name",
//     "Email": "email@gmail.com",
//     "Phone": "3927510316",
//     "Children": [
//         {
//             "Name": "K XA",
//             "Sex": "M",
//             "DoB": "2019-03-27",
//             "Age": 893
//         },
//         {
//             "Name": "J Simons",
//             "Sex": "F",
//             "DoB": "2014-11-7",
//             "Age": 3244
//         }
//     ],
//     "Conversations": {
//         "Conversation": "I don't care!",
//         "Time": "2020-03-15T02:50:14.609-05:00"
//     }
// }

exports.create = asyncHandler(async (req, res) => {
  var newFamilyInfo = req.body;

  // Extract User before Sequelize create — it's not a DB column
  const User = newFamilyInfo.User;
  delete newFamilyInfo.User;

  if (newFamilyInfo.id) {
    delete newFamilyInfo["id"];
  }

  try {
    const newFamily = await model.family.create(newFamilyInfo, {
      include: [
        model.conversations,
        model.child,
        { model: model.appointment, include: [model.schedule] },
      ],
    });

    // Log

    await log.createLog(
      "Family Created",
      User,
      "added a family (" + newFamily.id + ")"
    );

    res.status(200).send(newFamily);
  } catch (error) {
    console.error("Family create error:", error);
    res.status(500).json({ error: error.message });
  }
});

// batch upload families
exports.batchCreate = asyncHandler(async (req, res) => {
  try {
    var newFamilyInfo = req.body;

    const alphabet = "abcdefghijk".split("");

    const newFamily = await model.family.bulkCreate(newFamilyInfo, {
      include: [
        model.conversations,
        model.child,
        { model: model.appointment, include: [model.schedule] },
      ],
    });

    // update sibbling table & assign child id within each family
    for (var i = 0; i < newFamily.length; i++) {
      if (newFamily[i].Children) {
        if (newFamily[i].Children.length > 1) {
          var Children = await model.child.findAll({
            attributes: ["id"],
            where: { FK_Family: newFamily[i].id },
          });

          var siblings = [];

          for (var j = 0; j < Children.length; j++) {
            var childId = Children[j].id;

            Children.forEach((sibling) => {
              if (sibling.id != childId) {
                siblings.push({ FK_Child: childId, Sibling: sibling.id });
              }
            });

            // assign child id within each family
            if (!Children[j].IdWithinFamily) {
              Children[j].IdWithinFamily = alphabet[j];
              await model.child.update(Children[j], {
                where: { id: Children[j].id },
              });
            }
          }

          await model.sibling.bulkCreate(siblings);
        }
      }
    }

    res.status(200).send(newFamily);
  } catch (error) {
    console.error("Family batch create error:", error);
    res.status(500).json({ error: error.message });
  }
});

// batch upload families
exports.batchCreate0 = asyncHandler(async (req, res) => {
  try {
    const result = await familyService.batchImportFamilies(req.body);
    res.status(200).send(result);
  } catch (error) {
    console.error("Family batch import error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve all families from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.trainingMode === "true") {
    queryString.TrainingSet = true;
  } else {
    queryString.TrainingSet = false;
  }

  if (req.query.id) {
    queryString.id = req.query.id;
  }

  if (req.query.Email) {
    queryString.Email = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NamePrimary) {
    queryString.NamePrimary = { [Op.like]: `${req.query.NamePrimary}%` };
  }
  if (req.query.NameSecondary) {
    queryString.NameSecondary = { [Op.like]: `${req.query.NameSecondary}%` };
  }
  if (req.query.Phone) {
    queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.CellPhone) {
    queryString.CellPhone = { [Op.like]: `${req.query.CellPhone}%` };
  }

  if (req.query.NextContactDate) {
    queryString.NextContactDate = {
      [Op.or]: [
        {
          [Op.lte]: moment()
            .startOf("day")
            .toDate(),
        },
        { [Op.eq]: null },
      ],
      // [Op.between]: [
      //   moment().subtract(6, 'months').startOf("day").toDate(),
      //   moment().startOf("day").toDate()
      // ]
    };
  }

  if (req.query.AssignedLab) {
    queryString.AssignedLab = req.query.AssignedLab;
  }

  // queryString.NoMoreContact = 0;

  if (req.query.childName) {
    const children = await model.child.findAll({
      where: {
        Name: {
          [Op.like]: `${req.query.childName}%`,
        },
      },
    });

    var familyIDs = [];
    children.forEach((child) => {
      familyIDs.push(child.FK_Family);
    });

    queryString.id = familyIDs;
  }

  var families = await model.family.findAll({
    where: queryString,
    include: [
      { model: model.conversations, separate: true },
      familyService.childInclude(),
      familyService.scheduleInclude(true),
    ],
  });

  // remove families who requested "No more contact."
  var nOfRemoval = 0;
  families.forEach((family) => {
    if (family.NoMoreContact === 1) {
      var i = families.indexOf(family);
      families.splice(i, 1);

      nOfRemoval += 1;
    }
  });

  var message = "";

  if (families.length < 1) {
    if (nOfRemoval > 0) {
      message = "The family was removed from database upon parents' request.";
    } else {
      message = "Oops, we can't find the family you're looking for.";
    }
  } else {
    shuffle(families);
  }

  res.status(200).send({ families: families, message: message });
  // console.log("Search successful!");
});

// Retrieve all families from the database.
exports.followupSearch = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.trainingMode === "true") {
    queryString.TrainingSet = true;
  } else {
    queryString.TrainingSet = false;
  }

  queryString.NextContactDate = {
    [Op.or]: [
      {
        [Op.lte]: moment()
          .startOf("day")
          .toDate(),
      },
      { [Op.eq]: null },
    ],
  };

  if (req.query.AssignedLab) {
    queryString.AssignedLab = req.query.AssignedLab;
  }

  queryString.NoMoreContact = 0;

  queryString["$Schedules.Status$"] = {
    [Op.in]: ["TBD", "Rescheduling", "No Show"],
  };

  const families = await model.family.findAll({
    where: queryString,
    include: [
      { model: model.conversations, separate: true },
      familyService.childInclude(),
      {
        ...familyService.scheduleInclude(false),
        order: [[model.schedule, "AppointmentTime", "DESC"]],
      },
    ],
    order: [[{ model: model.schedule }, 'id', 'DESC']],
  });

  shuffle(families);

  res.status(200).send(families);
  console.log("Search successful!");
});

// Update a family by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedFamilyInfo = req.body;
  console.log("Family Information Updated!");

  try {
    const family = await model.family.update(updatedFamilyInfo, {
      where: { id: ID },
    });

    // Log
    const User = req.body.User;

    var logKeywords = "Family Updated";

    if ("NoMoreContact" in updatedFamilyInfo) {
      if (updatedFamilyInfo.NoMoreContact) {
        logKeywords = "Family Removed";
      }
    }

    await log.createLog(
      logKeywords,
      User,
      "updated a family's information (" + ID + ")"
    );

    res.status(200).send(family);
  } catch (error) {
    console.error("Family update error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.releaseFamilyNew = asyncHandler(async (req, res) => {
  var queryString = {};
  var IDs = [];

  queryString.Completed = 1;
  queryString["$Family.AssignedLab$"] = { [Op.ne]: null };

  // 2. The families have been contacted within the past 2 weeks, yet the appointment is tentative. These appointments are regarded as onGoing.
  var queryString2 = {};

  // queryString2.Status = ["TBD", "Rescheduling", "Rescheduled", "No Show", ];
  queryString2.Completed = 0;
  queryString2.updatedAt = {
    [Op.between]: [
      moment()
        .subtract(2, "w")
        .startOf("day")
        .toDate(),
      moment()
        .startOf("day")
        .toDate(),
    ],
  };

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [{ model: model.family }],
    });

    // release the families.
    IDs = schedules.map((schedule) => {
      // return {familyID: schedule.FK_Family,
      // labID: schedule.Appointments[0].Study.FK_Lab};
      return schedule.FK_Family
    });

    IDs = Array.from(new Set(IDs)); // unique IDs

    const schedulesOnGoing = await model.schedule.findAll({
      where: queryString2,
    });

    // remove the families with onGoing study appointments from the family list
    if (schedulesOnGoing.length > 0) {
      var IDsOnGoing = schedulesOnGoing.map((schedule) => {
        return schedule.FK_Family;
      });

      IDsOnGoing = Array.from(new Set(IDsOnGoing)); // unique IDs

      // remove the families with onGoing study appointments from the list of families completed studies.
      IDs = IDs.filter((id) => !IDsOnGoing.includes(id));

    }

    if (IDs.length > 0) {
      // update family by removing AssignedLab from the family
      const updateFamilyInfo = { AssignedLab: null };

      queryString = {};
      queryString.id = { [Op.in]: IDs };

      await model.family.update(updateFamilyInfo, {
        where: queryString,
      });

      // Log
      await log.createLog(
        "Family Lab Assisgnment Release",
        {},
        "Families (" +
        IDs.join(", ") +
        ") were no longer assigned to any lab due to schedule completion."
      );
    }

    if (res) {

      res.status(200).send(IDs);
    }

  } catch (error) {
    console.error("Family search error:", error);
    if (res) res.status(500).json({ error: error.message });
  }
});

// reassign lab to families which have ongoing studies
exports.assignLabtoFamilies = asyncHandler(async (req, res) => {
  var queryString = {};
  var IDs = [];

  queryString.Completed = 0;
  queryString["$Family.AssignedLab$"] = { [Op.eq]: null };
  queryString.createdAt = {
    [Op.between]: [
      moment()
        .subtract(15, "days")
        .startOf("day")
        .toDate(),
      moment()
        .toDate(),
    ],
  };

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      include: [{ model: model.family }, { model: model.appointment, include: [model.study] }],
    });

    // release the families.
    IDs = schedules.map((schedule) => {
      return {
        familyID: schedule.FK_Family,
        labID: schedule.Appointments[0].Study.FK_Lab
      };
    });

    IDs = Array.from(new Set(IDs)); // unique IDs

    IDs.forEach(async (idItem) => {
      const updateFamilyInfo = { AssignedLab: idItem.labID };

      await model.family.update(updateFamilyInfo, {
        where: { id: idItem.familyID },
      });

    })

    // if (IDs.length > 0) {
    //   // update family by removing AssignedLab from the family
    //   const updateFamilyInfo = { AssignedLab: null };

    //   queryString = {};
    //   queryString.id = {[Op.in]: IDs};

    //   await model.family.update(updateFamilyInfo, {
    //     where: queryString,
    //   });

    //   // Log
    //   await log.createLog(
    //     "Family Lab Assisgnment Release",
    //     {},
    //     "Families (" +
    //       IDs.join(", ") +
    //       ") were no longer assigned to any lab due to schedule completion."
    //   );
    // }

    if (res) {

      res.status(200).send(IDs);
    }

  } catch (error) {
    console.error("Family release error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.releaseFamily = asyncHandler(async (req, res) => {
  // get the ids of family whose study has completed studies, according to the following rules:
  var queryString = {};
  var queryString2 = {};
  var queryString3 = {};

  // 1. the appointment time is within the past 7 days and the appointment status was Confirmed. These studies are considered as completed.
  queryString.AppointmentTime = {
    [Op.between]: [
      moment()
        .subtract(1, "w")
        .startOf("day")
        .toDate(),
      moment()
        .subtract(1, "days")
        .startOf("day")
        .toDate(),
    ],
  };

  queryString.Status = "Confirmed";
  // queryString.Completed = 0;

  // 2. The families have been contacted within the past 2 weeks, yet the appointment is tentative. These appointments are regarded as onGoing.
  queryString2.Status = ["TBD", "Rescheduling", "Rescheduled", "No Show"];
  // queryString2.Completed = 0;
  queryString2.updatedAt = {
    [Op.between]: [
      moment()
        .subtract(2, "w")
        .startOf("day")
        .toDate(),
      moment()
        .add(2, "d")
        .startOf("day")
        .toDate(),
    ],
  };

  // 3. Recently rejected or cancelled studies. These studies are considered as completed.
  queryString3.Status = ["Cancelled", "Rejected"];
  queryString3.updatedAt = {
    [Op.between]: [
      moment()
        .subtract(2, "w")
        .startOf("day")
        .toDate(),
      moment()
        .subtract(1, "w")
        .startOf("day")
        .toDate(),
    ],
  };

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
    });

    const schedulesOnGoing = await model.schedule.findAll({
      where: queryString2,
    });

    const schedulesRejected = await model.schedule.findAll({
      where: queryString3,
    });

    var IDs = [];

    if (schedules.length > 0 || schedulesRejected.length > 0) {
      IDs = schedules.map((schedule) => {
        return schedule.FK_Family;
      });

      schedulesRejected.forEach((schedule) => {
        IDs.push(schedule.FK_Family);
      });

      IDs = Array.from(new Set(IDs)); // unique IDs

      // remove the families with onGoing study appointments from the family list
      if (schedulesOnGoing.length > 0) {
        var IDsOnGoing = schedulesOnGoing.map((schedule) => {
          return schedule.FK_Family;
        });

        IDsOnGoing = Array.from(new Set(IDsOnGoing)); // unique IDs

        // remove the families with onGoing study appointments from the list of families completed studies.
        IDs = IDs.filter((id) => !IDsOnGoing.includes(id));

        // IDsOnGoing.forEach((familyOnGoing) => {
        //   const index = IDs.indexOf(familyOnGoing);
        //   if (index > -1) {
        //     IDs.splice(index, 1);
        //   }
        // });
      }
    }

    // update schedule by setting Completed to true
    var scheduleIDs = schedules.map((schedule) => {
      return schedule.id;
    });

    schedulesRejected.forEach((schedule) => {
      scheduleIDs.push(schedule.id);
    });

    scheduleIDs = Array.from(new Set(scheduleIDs)); // unique scheduleIDs

    if (scheduleIDs.length > 0) {
      await model.schedule.update(
        { Completed: 1 },
        {
          where: { id: scheduleIDs },
        }
      );
    }

    if (IDs.length > 0) {
      // update family by removing AssignedLab from the family
      const updateFamilyInfo = { AssignedLab: null };

      await model.family.update(updateFamilyInfo, {
        where: { id: IDs },
      });

      // Log
      await log.createLog(
        "Family Lab Assisgnment Release",
        {},
        "Families (" +
        IDs.join(", ") +
        ") were no longer assigned to any lab due to study completion"
      );

      // res.status(200).send(IDs.length + " families released.");
    }
    // else {
    //   res.status(200).send("no family needs to be released.");
    // }
  } catch (error) {
    console.error("Family assign lab error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a family with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const family = await model.family.destroy({
    where: { id: req.query.id },
  });

  // Log
  const User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;

  await log.createLog(
    "Family Deleted",
    User,
    "deleted family (" + req.query.id + ") from the database"
  );

  res.status(200).json(family);
});

// a special function to assign child ids within a family
exports.searchSpecial = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.Email) {
    queryString.Email = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NamePrimary) {
    queryString.NamePrimary = { [Op.like]: `${req.query.NamePrimary}%` };
  }
  if (req.query.NameSecondary) {
    queryString.NameSecondary = { [Op.like]: `${req.query.NameSecondary}%` };
  }
  if (req.query.Phone) {
    queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  }

  const alphabet = "abcdefghijk".split("");

  const families = await model.family.findAll({
    where: queryString,
    include: [model.child],
  });

  families.forEach((family) => {
    family.Children.forEach(async (child, index) => {
      child.IdWithinFamily = alphabet[index];

      await model.child.update(
        { IdWithinFamily: child.IdWithinFamily },
        {
          where: { id: child.id },
        }
      );
    });
  });

  res.status(200).send(families);
  console.log("Search successful!");
});

exports.fillNextContactDate = asyncHandler(async (req, res) => {
  // var queryString = {};

  // if (req.query.id) {
  //   queryString.id = req.query.id;
  // }
  // if (req.query.Email) {
  //   queryString.Email = { [Op.like]: `${req.query.Email}%` };
  // }
  // if (req.query.NamePrimary) {
  //   queryString.NamePrimary = { [Op.like]: `${req.query.NamePrimary}%` };
  // }
  // if (req.query.NameSecondary) {
  //   queryString.NameSecondary = { [Op.like]: `${req.query.NameSecondary}%` };
  // }
  // if (req.query.Phone) {
  //   queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  // }

  // queryString.Email = { [Op.like]: `` };

  const families = await model.family.findAll();
  // console.log(families.length);

  families.forEach(async (family) => {
    await model.family.update(
      { NextContactDate: family.createdAt },
      {
        where: { id: family.id },
      }
    );
  });

  res.status(200);
});

exports.changeTrainingFamilyEmail = asyncHandler(async (req, res) => {
  var queryString = {};

  queryString.TrainingSet = true;

  const families = await model.family.findAll({ where: queryString });
  // console.log(families.length);

  families.forEach(async (family) => {
    var newEmail = family.Email;

    // newEmail = newEmail.replace(/dsd.cs/g, '');

    newEmail = newEmail + "dsd.cxs";

    await model.family.update(
      { Email: newEmail },
      {
        where: { id: family.id },
      }
    );
  });

  res.status(200);
});

// ─── DATA INTEGRITY: FIND DUPLICATES ────────────────────────────────────
exports.getDuplicates = asyncHandler(async (req, res) => {
  // 1. Find emails that appear more than once
  //    Use Op.and to avoid the JS duplicate-key collision when checking null + empty string
  const emailDups = await model.family.findAll({
    attributes: ['Email'],
    where: {
      Email: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      TrainingSet: false
    },
    group: ['Email'],
    having: model.sequelize.literal('count(Email) > 1')
  });

  // 2. Find phones that appear more than once
  const phoneDups = await model.family.findAll({
    attributes: ['Phone'],
    where: {
      Phone: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      TrainingSet: false
    },
    group: ['Phone'],
    having: model.sequelize.literal('count(Phone) > 1')
  });

  const emails = emailDups.map(e => e.Email);
  const phones = phoneDups.map(p => p.Phone);

  if (emails.length === 0 && phones.length === 0) {
    return res.status(200).json([]); // No duplicates found
  }

  // 3. Fetch full records for the suspicious families
  const duplicateFamilies = await model.family.findAll({
    where: {
      [Op.or]: [
        { Email: { [Op.in]: emails } },
        { Phone: { [Op.in]: phones } }
      ],
      TrainingSet: false
    },
    include: [
      // Only fetch the fields the frontend actually needs (reduces payload)
      { model: model.child, attributes: ['id', 'Name', 'DoB', 'Sex'] },
      { model: model.schedule, attributes: ['id'] }
    ]
  });

  // 4. Group them for the frontend
  let groups = [];
  const processedIds = new Set();

  duplicateFamilies.forEach(fam => {
    if (processedIds.has(fam.id)) return;
    
    const related = duplicateFamilies.filter(f => 
      (f.Email && fam.Email && f.Email.toLowerCase() === fam.Email.toLowerCase()) || 
      (f.Phone && fam.Phone && f.Phone === fam.Phone)
    );

    if (related.length > 1) {
      groups.push({
        matchReason: (fam.Email === related[1].Email) ? `Matched Email: ${fam.Email}` : `Matched Phone: ${fam.Phone}`,
        families: related
      });
      related.forEach(r => processedIds.add(r.id));
    }
  });

  res.status(200).json(groups);
});

// ─── DATA INTEGRITY: MERGE RECORDS ──────────────────────────────────────
exports.merge = asyncHandler(async (req, res) => {
  const { primaryId, secondaryIds, mergeChildren, User } = req.body;

  if (!primaryId || !secondaryIds || secondaryIds.length === 0) {
    return res.status(400).json({ error: "Missing primaryId or secondaryIds." });
  }

  // Wrap all mutations in a transaction so a mid-merge failure leaves no partial state
  await model.sequelize.transaction(async (t) => {
    const opts = { transaction: t };

    // 1. Always move schedules, appointments, and conversations to the Primary Family
    await model.schedule.update({ FK_Family: primaryId }, { where: { FK_Family: { [Op.in]: secondaryIds } }, ...opts });
    await model.appointment.update({ FK_Family: primaryId }, { where: { FK_Family: { [Op.in]: secondaryIds } }, ...opts });
    await model.conversations.update({ FK_Family: primaryId }, { where: { FK_Family: { [Op.in]: secondaryIds } }, ...opts });

    // 2. ALWAYS move children to the primary family to prevent FK cascade deletion.
    await model.child.update({ FK_Family: primaryId }, { where: { FK_Family: { [Op.in]: secondaryIds } }, ...opts });

    // 3. If mergeChildren: re-letter IdWithinFamily and rebuild sibling table.
    if (mergeChildren !== false) {
      const alphabet = "abcdefghijk".split("");
      const children = await model.child.findAll({ where: { FK_Family: primaryId }, order: [['DoB', 'ASC']], ...opts });

      for (let i = 0; i < children.length; i++) {
        await model.child.update({ IdWithinFamily: alphabet[i] }, { where: { id: children[i].id }, ...opts });
      }

      const childIds = children.map(c => c.id);
      await model.sibling.destroy({ where: { FK_Child: { [Op.in]: childIds } }, ...opts });
      await model.sibling.destroy({ where: { Sibling: { [Op.in]: childIds } }, ...opts });

      const siblingRows = [];
      for (let i = 0; i < children.length; i++) {
        for (let j = 0; j < children.length; j++) {
          if (i !== j) siblingRows.push({ FK_Child: children[i].id, Sibling: children[j].id });
        }
      }
      if (siblingRows.length > 0) {
        await model.sibling.bulkCreate(siblingRows, { ignoreDuplicates: true, ...opts });
      }
    }

    // 4. Delete the now-empty secondary families
    await model.family.destroy({ where: { id: { [Op.in]: secondaryIds } }, ...opts });
  });

  // 5. Log outside the transaction (non-blocking; log failure must not roll back the merge)
  try {
    await log.createLog("Family Merged", User, `Merged families [${secondaryIds.join(', ')}] into Master Family (${primaryId}). Children merged: ${mergeChildren !== false}`);
  } catch (logErr) {
    console.error("Merge log failed (merge itself succeeded):", logErr.message);
  }

  res.status(200).json({ message: "Families successfully merged!" });
});
