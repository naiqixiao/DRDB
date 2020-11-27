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

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    const logFile = logFolder + "/log.txt";

    var logInfo =
      "[Family Created] " +
      User.Name +
      " (" +
      User.Email +
      ") from " +
      User.LabName +
      " added a family (" +
      newFamily.id +
      ") at " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

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
            Children[j].IdWithinFamily = alphabet[Children.length];
            await model.child.update(Children[j], {
              where: { id: Children[j].id },
            });
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
                through: { model: model.experimenterAssignment },
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

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }

  const logFile = logFolder + "/log.txt";

  var logInfo =
    "[Family Updated] " +
    User.Name +
    " (" +
    User.Email +
    ") from " +
    User.LabName +
    " updated a family's information (" +
    ID +
    ") at " +
    new Date().toString() +
    " - " +
    User.IP +
    "\r\n";

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo);
  } else {
    fs.writeFileSync(logFile, logInfo);
  }

  res.status(200).send(family);
  console.log("Family Information Updated!");
});

// Delete a family with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const family = await model.family.destroy({
    where: { id: req.query.id },
  });

  // Log
  var User = JSON.parse(req.query.User);

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }

  const logFile = logFolder + "/log.txt";

  var logInfo =
    "[Family Deleted] " +
    User.Name +
    " (" +
    User.Email +
    ") from " +
    User.LabName +
    " deleted family (" +
    ID +
    ") from the database at " +
    new Date().toString() +
    " - " +
    User.IP +
    "\r\n";

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo);
  } else {
    fs.writeFileSync(logFile, logInfo);
  }

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
  console.log(families.length);

  families.forEach(async (family) => {

    var newEmail = family.Email
    
    // newEmail = newEmail.replace(/dsd.cs/g, '');
    
    newEmail = newEmail + "dsd.cxs"

    await model.family.update(
      { Email: newEmail},
      {
        where: { id: family.id },
      }
    );
  });

  res.status(200);
});
