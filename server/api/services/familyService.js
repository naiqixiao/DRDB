/**
 * Family Service
 *
 * Business logic for family batch imports, deduplication, and sibling management.
 * Also houses the shared Sequelize include definition used by multiple search handlers.
 * Extracted from controllers/family.js for maintainability.
 */

const model = require("../models/DRDB");
const { Op } = require("sequelize");

const ALPHABET = "abcdefghijk".split("");

// ─── Shared Sequelize include blocks ─────────────────────────────

/**
 * Returns the standard include block for child queries.
 * Used by family search and followup search.
 */
function childInclude() {
  return {
    model: model.child,
    separate: true,
    include: [
      {
        model: model.appointment,
        attributes: ["FK_Study"],
      },
      {
        model: model.family,
        attributes: ["AutismHistory"],
      },
    ],
    order: [["id", "DESC"]],
  };
}

/**
 * Returns the standard appointment include block with study, lab, and experimenter joins.
 * Used inside schedule includes for family search and followup search.
 */
function appointmentInclude() {
  return {
    model: model.appointment,
    separate: true,
    include: [
      {
        model: model.child,
        include: [
          {
            model: model.appointment,
            attributes: ["FK_Study"],
          },
          {
            model: model.family,
            attributes: ["AutismHistory"],
          },
        ],
      },
      {
        model: model.study,
        include: [
          { model: model.lab },
          {
            model: model.personnel,
            as: "Experimenters",
            through: {
              model: model.experimenter,
            },
          },
        ],
      },
      {
        model: model.personnel,
        as: "PrimaryExperimenter",
        through: { model: model.experimenterAssignment },
        attributes: [
          "id",
          "Name",
          "Email",
          "Calendar",
          "ZoomLink",
          "Initial",
        ],
      },
      {
        model: model.personnel,
        as: "SecondaryExperimenter",
        through: { model: model.experimenterAssignment_2nd },
        attributes: [
          "id",
          "Name",
          "Email",
          "Calendar",
          "ZoomLink",
          "Initial",
        ],
      },
    ],
  };
}

/**
 * Returns the full schedule include block used by family search.
 * @param {boolean} [separateSchedule=true] - Whether to use separate: true for the schedule query
 */
function scheduleInclude(separateSchedule = true) {
  return {
    model: model.schedule,
    separate: separateSchedule,
    order: [["id", "DESC"]],
    include: [
      {
        model: model.family,
        include: [
          {
            model: model.child,
            include: [
              {
                model: model.appointment,
                attributes: ["FK_Study"],
              },
              {
                model: model.family,
                attributes: ["AutismHistory"],
              },
            ],
          },
        ],
      },
      {
        model: model.personnel,
      },
      appointmentInclude(),
    ],
  };
}

// ─── Batch import logic ─────────────────────────────────────────

function containsObject(obj, array) {
  for (var i = 0; i < array.length; i++) {
    if (
      array[i].FK_Child === obj.FK_Child &&
      array[i].Sibling === obj.Sibling
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Import families in batch, with deduplication and sibling assignment.
 *
 * @param {Array} newFamilies - Array of family records (from CSV upload)
 * @returns {{ doubleCheckList, nOfSkip, nOfAdded, skipList }}
 */
async function batchImportFamilies(newFamilies) {
  var doubleCheckList = [];
  var skipList = [];
  var skipImport = false;
  var nOfSkip = 0;
  var nOfAdded = 0;

  for (var i = 0; i < newFamilies.length; i++) {
    var child = {};
    child.Name = newFamilies[i].Name;
    child.Sex = newFamilies[i].Sex;
    child.Gender = newFamilies[i].Gender;
    child.DoB = newFamilies[i].DoB;
    child.Age = newFamilies[i].Age;
    child.Note = newFamilies[i].Notes;
    child.BirthWeight = newFamilies[i].BirthWeight;
    child.Gestation = newFamilies[i].Gestation;
    child.HearingLoss = newFamilies[i].HearingLoss;
    child.VisionLoss = newFamilies[i].VisionLoss;
    child.RecruitmentMethod = newFamilies[i].RecruitmentMethod;

    const phone = newFamilies[i].Phone;
    const email = newFamilies[i].Email;

    var searchString = [];

    if (phone && phone != "") {
      searchString.push({ Phone: phone });
    }
    if (email && email != "") {
      searchString.push({ Email: email });
    }

    var family = await model.family.findOne({
      where: {
        [Op.or]: searchString,
      },
      include: [model.child],
    });

    var newFamily;

    if (!!family) {
      // Family exists — check for duplicates
      if ("DoB" in newFamilies[i]) {
        family.Children.forEach((existingChild) => {
          if (existingChild.DoB == child.DoB) {
            if (existingChild.Name == child.Name) {
              skipImport = true;
              nOfSkip += 1;
              skipList.push({
                Email: family.Email,
                Name: child.Name,
                DoB: child.DoB,
              });
            } else {
              doubleCheckList.push({
                FK_Family: family.id,
                Email: family.Email,
                childID: existingChild.id,
              });
            }
          }
        });

        if (!skipImport) {
          child.FK_Family = family.id;
          await model.child.create(child);

          newFamily = await model.family.findOne({
            where: { id: family.id },
            include: [model.child],
          });
        }
      } else {
        skipImport = true;
      }
    } else {
      // New family
      family = await model.family.create(newFamilies[i]);

      if ("DoB" in newFamilies[i]) {
        child.FK_Family = family.id;
        child.IdWithinFamily = ALPHABET[0];

        await model.child.create(child);

        newFamily = await model.family.findOne({
          where: { id: family.id },
          include: [model.child],
        });
      } else {
        skipImport = true;
      }
    }

    // Update sibling table & assign child IDs within family
    if (!skipImport) {
      if (newFamily.Children.length > 1) {
        var Children = newFamily.Children;
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

          if (Children[j].IdWithinFamily == null) {
            Children[j].IdWithinFamily = ALPHABET[j];

            await model.child.update(
              { IdWithinFamily: ALPHABET[j] },
              { where: { id: childId } }
            );
          }
        }

        var existingSibling = await model.sibling.findAll({
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

    if (skipImport) {
      skipImport = false;
    } else {
      nOfAdded += 1;
    }
  }

  doubleCheckList = doubleCheckList.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.FK_Family === item.FK_Family)
  );

  return {
    doubleCheckList,
    nOfSkip,
    nOfAdded,
    skipList,
  };
}

module.exports = {
  childInclude,
  appointmentInclude,
  scheduleInclude,
  batchImportFamilies,
};
