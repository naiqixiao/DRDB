const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

// Create and Save a new family

//   {
//     "NameMom": "Mom's name",
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

    res.status(200).send(newFamily);
  } catch (error) {
    throw error;
  }
});

// batch upload families
exports.batchCreate = asyncHandler(async (req, res) => {
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

  res.status(200).send(newFamily);
});

// Retrieve all families from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.Email) {
    queryString.Email = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NameMom) {
    queryString.NameMom = { [Op.like]: `${req.query.NameMom}%` };
  }
  if (req.query.NameDad) {
    queryString.NameDad = { [Op.like]: `${req.query.NameDad}%` };
  }
  if (req.query.Phone) {
    queryString.Phone = { [Op.like]: `${req.query.Phone}%` };
  }

  // queryString.NextContactDate = { [Op.lt]: new Date() };
  queryString.NoMoreContact = 0;

  // console.log(req.query);

  const families = await model.family.findAll({
    where: queryString,
    include: [
      model.conversations,
      {
        model: model.child,
        include: [{ model: model.appointment, attributes: ["FK_Study"] }],
      },
      {
        model: model.appointment,
        include: [
          { model: model.child, attributes: ["Name", "DoB", "Sex"] },
          {
            model: model.study,
            attributes: [
              "StudyName",
              "MinAge",
              "MaxAge",
              "EmailTemplate",
              "StudyType",
            ],
          },
          { model: model.schedule },
        ],
      },
    ],
  });

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
  res.status(200).send(family);
  console.log("Family Information Updated!");
});

// Delete a family with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const family = await model.family.destroy({
    where: req.query,
  });
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
  if (req.query.NameMom) {
    queryString.NameMom = { [Op.like]: `${req.query.NameMom}%` };
  }
  if (req.query.NameDad) {
    queryString.NameDad = { [Op.like]: `${req.query.NameDad}%` };
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

      await model.child.update({"IdWithinFamily": child.IdWithinFamily}, {
        where: { id: child.id },
      });
    });
  });

  res.status(200).send(families);
  console.log("Search successful!");
});
