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

  const newFamily = await model.family.create(newFamilyInfo, {
    include: [model.conversations, model.child, model.appointment]
  });

  // update sinbing table
  if (newFamily.Children.length > 1) {
    const Children = await model.child.findAll({
      attributes: ["id"],
      where: { FK_Family: newFamily.id }
    });

    var siblings = [];

    for (var i = 0; i < Children.length; i++) {
      var childId = Children[i].id;

      Children.forEach(sibling => {
        if (sibling.id != childId) {
          siblings.push({ FK_Child: childId, Sibling: sibling.id });
        }
      });
    }

    await model.sibling.bulkCreate(siblings);
  }

  res.status(200).send(newFamily);
});

// batch upload families
exports.batchCreate = asyncHandler(async (req, res) => {
  var newFamilyInfo = req.body;

  const newFamily = await model.family.bulkCreate(newFamilyInfo, {
    include: [model.conversations, model.child, model.appointment]
  });

  // update sibbling table
  for (var i = 0; i < newFamily.length; i++) {
    if (newFamily[i].Children.length > 1) {
      var Children = await model.child.findAll({
        attributes: ["id"],
        where: { FK_Family: newFamily[i].id }
      });

      var siblings = [];

      for (var j = 0; j < Children.length; j++) {
        var childId = Children[j].id;

        Children.forEach(sibling => {
          if (sibling.id != childId) {
            siblings.push({ FK_Child: childId, Sibling: sibling.id });
          }
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
        include: [{ model: model.appointment, attributes: ["FK_Study"] }]
      },
      {
        model: model.appointment,
        include: [
          { model: model.child, attributes: ["Name", "DoB"] },
          { model: model.study, attributes: ["StudyName", "MinAge", "MaxAge"] }
        ]
      }
    ]
  });
  res.status(200).send(families);
  console.log("Search successful!");
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.query.id;
  var updatedFamilyInfo = req.body;

  // prevent change id.
  if (updatedFamilyInfo.id) {
    delete updatedFamilyInfo["id"];
  }

  const family = await model.family.update(updatedFamilyInfo, {
    where: { id: ID },
    include: [model.conversations, model.child, model.appointment]
  });
  res.status(200).send(family);
  console.log("Family Information Updated!");
});

// Delete a Tutorial with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const family = await model.family.destroy({
    where: req.query
  });
  res.status(200).json(family);
});
