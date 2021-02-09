const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const fs = require("fs");
const Sequelize = require("sequelize");

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
    const User = req.body.User;

    await log.createLog("Family Created", User, "added a family (" +
      newFamily.id +
      ")");

    res.status(200).send(newFamily);
  } catch (error) {
    throw error;
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
    throw error;
  }
});

// batch upload families
exports.batchCreate0 = asyncHandler(async (req, res) => {
  try {
    var newFamily = req.body;

    const alphabet = "abcdefghijk".split("");

    for (var i = 0; i < newFamily.length; i++) {
      // check whether the family exists

      var child = {};
      child.Name = newFamily[i].Child_Last_Name
        ? newFamily[i].Child_First_Name + " " + newFamily[i].Child_Last_Name
        : newFamily[i].Child_First_Name;
      child.Sex = newFamily[i].Sex;
      child.DoB = newFamily[i].DoB;
      child.Age = newFamily[i].Age;
      child.Note = newFamily[i].Notes;
      child.BirthWeight = newFamily[i].Birthweight;
      child.Gestation = newFamily[i].Gestation;
      child.RecruitmentMethod = newFamily[i].RecruitmentMethod;

      const phone = newFamily[i].Phone;
      const email = newFamily[i].Email;

      var searchString = {};

      if (phone) {
        searchString.Phone = phone;
      }
      if (email) {
        searchString.Email = email;
      }

      var family = await model.family.findOne({ where: searchString });

      if (!!family) {
        // when the family exists in the database, add the children to this family.
        // in the future, outout the existing family and the current familly to
        // remind users the potential conflict and allow users to decide whether the merge.

        // newFamily[i].Children.forEach((child) => {
        //   child.FK_Family = family.id;
        // });

        child.FK_Family = family.id;

        // if any of the children was already imported to the database, would the child be skipped?
        await model.child.create(child);

        family = await model.family.findOne({
          where: { id: family.id },
          include: [model.child],
        });
      } else {
        family = await model.family.create(newFamily[i]);
        child.FK_Family = family.id;
        child.IdWithinFamily = IdWithinFamily = alphabet[0];
        await model.child.create(child);

        family = await model.family.findOne({
          where: { id: family.id },
          include: [model.child],
        });
      }

      // update sibbling table & assign child id within this family
      if (family.Children.length > 1) {
        var Children = family.Children;

        var siblings = [];

        var children = [];

        for (var j = 0; j < Children.length; j++) {
          var childId = Children[j].id;

          Children.forEach((sibling) => {
            if (sibling.id != childId) {
              siblings.push({ FK_Child: childId, Sibling: sibling.id });
            }
          });

          children.push(childId);

          // assign child id within each family
          if (Children[j].IdWithinFamily == null) {
            Children[j].IdWithinFamily = alphabet[j];

            await model.child.update(
              { IdWithinFamily: alphabet[j] },
              {
                where: { id: childId },
              }
            );
          }
        }

        existingSibling = await model.sibling.findAll({
          attributes: ["FK_Child", "Sibling"],
          where: {
            FK_Child: { [Op.in]: children },
          },
        });

        var filteredSiblings = siblings.filter(function (value) {
          return !containsObject(value, existingSibling);
        });

        await model.sibling.bulkCreate(filteredSiblings);
      }
    }

    res.status(200).send("new family imported!");
  } catch (error) {
    throw error;
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

  queryString.NoMoreContact = 0;

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

  const families = await model.family.findAll({
    where: queryString,
    include: [
      model.conversations,
      {
        model: model.child,
        include: [
          {
            model: model.appointment,
            attributes: ["FK_Study"],
          },
        ],
      },
      {
        model: model.schedule,
        include: [
          {
            model: model.family,
          },
          {
            model: model.personnel,
          },
          {
            model: model.appointment,
            include: [
              {
                model: model.child,
              },
              {
                model: model.study,
              },
              {
                model: model.personnel,
                as: "PrimaryExperimenter",
                through: { model: model.experimenterAssignment },
                attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"],
              },
              {
                model: model.personnel,
                as: "SecondaryExperimenter",
                through: { model: model.experimenterAssignment_2nd },
                attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"],
              },
            ],
          },
        ],
        order: [[model.schedule, "AppointmentTime", "DESC"]],
      },
    ],
  });

  shuffle(families);

  res.status(200).send(families);
  console.log("Search successful!");
});

// Update a family by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedFamilyInfo = req.body;

  const family = await model.family.update(updatedFamilyInfo, {
    where: { id: ID },
  });

  // Log
  const User = req.body.User;

  var logKeywords = '[Family Updated] ';

  if ('NoMoreContact' in updatedFamilyInfo) {
    if (updatedFamilyInfo.NoMoreContact) {
      logKeywords = '[Family Removed] '
    }
  }

  await log.createLog(logKeywords, User, "updated a family's information (" +
    ID +
    ")");

  res.status(200).send(family);
  console.log("Family Information Updated!");
});

exports.releaseFamily = asyncHandler(async (req, res) => {
  // get the ids of family whoes study has completed.
  var queryString = {};
  var queryString2 = {};
  var queryString3 = {};

  queryString.AppointmentTime = {
    [Op.lte]: moment()
      .subtract(1, "days")
      .startOf("day")
      .toDate(),
  };

  queryString.Status = "Confirmed";
  queryString.Completed = 0;

  queryString2.Status = ["TBD", "Rescheduling", "Rescheduled", "No Show"];
  queryString2.Completed = 0;
  queryString2.createdAt = {
    [Op.between]: [
      moment()
        .subtract(2, "M")
        .startOf("day")
        .toDate(),
      moment()
        .add(2, "M")
        .startOf("day")
        .toDate(),
    ],
  };

  queryString3.Status = ["Cancelled", "Rejected"];
  queryString3.Completed = 0;

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

      // remove the families with incoming studies from the family list
      if (schedulesOnGoing.length > 0) {
        var IDsOnGoing = schedulesOnGoing.map((schedule) => {
          return schedule.FK_Family;
        });

        IDsOnGoing = Array.from(new Set(IDsOnGoing)); // unique IDs

        IDsOnGoing.forEach((familyOnGoing) => {
          const index = IDs.indexOf(familyOnGoing);
          if (index > -1) {
            IDs.splice(index, 1);
          }
        });
      }
    }

    var scheduleIDs = schedules.map((schedule) => {
      return schedule.id;
    });

    schedulesRejected.forEach((schedule) => {
      scheduleIDs.push(schedule.id);
    });

    scheduleIDs = Array.from(new Set(scheduleIDs)); // unique scheduleIDs

    if (scheduleIDs.length > 0) {
      await model.schedule.update(
        { Completed: true },
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
      await log.createLog("Family Lab Assisgnment Release", {}, "Families (" +
        IDs.join(", ") +
        ") were no longer assigned to any lab due to study completion");


      // res.status(200).send(IDs.length + " families released.");
    }
    // else {
    //   res.status(200).send("no family needs to be released.");
    // }
  } catch (error) {
    throw error;
  }
});

// Delete a family with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const family = await model.family.destroy({
    where: { id: req.query.id },
  });

  // Log
  const User = JSON.parse(req.query.User);

  await log.createLog("Family Deleted", User, "deleted family (" +
    ID +
    ") from the database");

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
  console.log(families.length);

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
