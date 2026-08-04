const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const log = require("../controllers/log");
const {
  EVENT_TYPES,
  ACHIEVEMENT_CATEGORIES,
  PERSONNEL_ROLES,
  isRoleEvent,
  recordPersonnelHistory,
  syncCurrentPersonnelRole,
} = require("../services/personnelHistoryService");

const HISTORY_MANAGERS = new Set(["Admin", "PI", "Lab manager"]);

async function getRequester(req) {
  return model.personnel.findByPk(req.userData?.id, {
    attributes: ["id", "FK_Lab", "Role", "Name", "Email"],
  });
}

async function getTimelineMember(req, res) {
  const requester = await getRequester(req);
  const member = await model.personnel.findByPk(req.params.id || req.body.personnelId, {
    attributes: ["id", "FK_Lab", "Name"],
  });
  if (!requester || !member) {
    res.status(404).json({ error: "Personnel record not found." });
    return null;
  }
  if (requester.FK_Lab !== member.FK_Lab) {
    res.status(403).json({ error: "Forbidden." });
    return null;
  }
  return { requester, member };
}

function canManageHistory(requester) {
  return HISTORY_MANAGERS.has(requester.Role);
}

// Create and Save a new personnel
exports.create = asyncHandler(async (req, res) => {
  var newPersonnelInfo = req.body;
  const personnel = await model.sequelize.transaction(async (transaction) => {
    const created = await model.personnel.create(newPersonnelInfo, { transaction });
    await recordPersonnelHistory(model, {
      FK_Personnel: created.id, FK_Lab: created.FK_Lab, EventType: "joined",
      EffectiveDate: created.createdAt, Role: created.Role, CreatedBy: req.userData?.id || null,
    }, { transaction });
    return created;
  });

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

  if (req.query.FK_Lab) {
    queryString.FK_Lab = req.query.FK_Lab;
  }

  if (req.query.study) {
    queryString["$AssignedStudies.id$"] = req.query.study;
  }

  queryString.Retired = false;

  // console.log(queryString)
  const personnel = await model.personnel.findAll({
    where: queryString,
    include: [
      model.lab,
      // model.appointment,
      {
        model: model.study,
        as: "AssignedStudies",
        through: {
          model: model.experimenter,
        },
      },
      {
        model: model.study,
        as: "StudyinCharge",
      },
    ],
  });

  res.status(200).send(personnel);
});

// Update a Tutorial by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var ID = req.body.id;
  var updatedPersonnelInfo = { ...req.body };

  if (updatedPersonnelInfo.id) {
    delete updatedPersonnelInfo["id"];
  }

  delete updatedPersonnelInfo.User;
  delete updatedPersonnelInfo.HistoryEffectiveDate;

  const requestedRole = updatedPersonnelInfo.Role;
  delete updatedPersonnelInfo.Role;

  const previousPersonnel = await model.personnel.findByPk(ID);
  if (!previousPersonnel) return res.status(404).json({ error: "Personnel record not found." });

  await model.sequelize.transaction(async (transaction) => {
    await model.personnel.update(updatedPersonnelInfo, { where: { id: ID }, transaction });
    // Backward-compatible support for older clients that still submit Role with profile updates.
    // The role change is recorded first, then the Personnel projection is recalculated from history.
    if (requestedRole && requestedRole !== previousPersonnel.Role) {
      if (!PERSONNEL_ROLES.has(requestedRole)) throw new Error("Unsupported personnel role.");
      await recordPersonnelHistory(model, {
        FK_Personnel: previousPersonnel.id,
        FK_Lab: previousPersonnel.FK_Lab,
        EventType: "role_changed",
        Role: requestedRole,
        EffectiveDate: req.body.HistoryEffectiveDate,
        CreatedBy: req.userData?.id || null,
      }, { transaction });
      await syncCurrentPersonnelRole(model, previousPersonnel.id, transaction);
    }
  });

  const personnel = await model.personnel.findOne({
    where: { id: ID },
    include: [
      model.lab,
      {
        model: model.study,
        as: "AssignedStudies",
        through: { model: model.experimenter },
      },
      {
        model: model.study,
        as: "StudyinCharge",
      },
    ],
  });

  // Log
  const User = req.body.User;

  await log.createLog("Personnel Updated", User, "update personnel information (" +
    personnel.Name + ")");

  res.status(200).send(personnel);
  console.log("Personnel Information Updated!");
});

// Retrieve one member's timeline. The join date is derived from the earliest role/join event.
exports.getHistory = asyncHandler(async (req, res) => {
  const context = await getTimelineMember(req, res);
  if (!context) return;
  const entries = await model.personnelHistory.findAll({
    where: { FK_Personnel: context.member.id, FK_Lab: context.member.FK_Lab },
    order: [["EffectiveDate", "DESC"], ["id", "DESC"]],
  });
  const joinEntries = entries.filter((entry) => entry.EventType === "joined");
  const roleEntries = joinEntries.length ? joinEntries : entries.filter((entry) => entry.EventType === "role_changed");
  const joinedEntry = roleEntries.reduce((earliest, entry) =>
    !earliest || new Date(entry.EffectiveDate) < new Date(earliest.EffectiveDate) ? entry : earliest, null);
  const currentRoleEntry = entries.find((entry) => isRoleEvent(entry) && PERSONNEL_ROLES.has(entry.Role)) || null;
  res.status(200).json({
    entries,
    joinedDate: joinedEntry?.EffectiveDate || null,
    currentRole: currentRoleEntry?.Role || null,
    currentRoleEntryId: currentRoleEntry?.id || null,
  });
});

exports.createHistory = asyncHandler(async (req, res) => {
  const context = await getTimelineMember(req, res);
  if (!context) return;
  if (!canManageHistory(context.requester)) return res.status(403).json({ error: "Only senior managers can manage personnel history." });

  const { EventType = "achievement_note", EffectiveDate, Role, FK_Study, Category, Title, Detail } = req.body;
  if (!EVENT_TYPES.has(EventType)) return res.status(400).json({ error: "Unsupported history event type." });
  if (EventType === "achievement_note" && !Title?.trim()) return res.status(400).json({ error: "Achievement title is required." });
  if (EventType === "role_changed" && !PERSONNEL_ROLES.has(Role)) return res.status(400).json({ error: "A valid role is required for a role update." });
  if (Category && !ACHIEVEMENT_CATEGORIES.has(Category)) return res.status(400).json({ error: "Unsupported achievement category." });

  let study = null;
  if (FK_Study) {
    study = await model.study.findOne({ where: { id: FK_Study, FK_Lab: context.member.FK_Lab } });
    if (!study) return res.status(400).json({ error: "Study must belong to the member's lab." });
  }
  try {
    const entry = await model.sequelize.transaction(async (transaction) => {
      const created = await recordPersonnelHistory(model, {
        FK_Personnel: context.member.id, FK_Lab: context.member.FK_Lab, EventType,
        EffectiveDate, Role, FK_Study: study?.id || null, StudyName: study?.StudyName || null,
        Category: Category || null, Title: Title?.trim() || null, Detail: Detail?.trim() || null,
        CreatedBy: context.requester.id,
      }, { transaction });
      if (isRoleEvent(created)) await syncCurrentPersonnelRole(model, context.member.id, transaction);
      return created;
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

exports.updateHistory = asyncHandler(async (req, res) => {
  const context = await getTimelineMember(req, res);
  if (!context) return;
  if (!canManageHistory(context.requester)) return res.status(403).json({ error: "Only senior managers can manage personnel history." });
  const entry = await model.personnelHistory.findOne({ where: { id: req.params.entryId, FK_Personnel: context.member.id, FK_Lab: context.member.FK_Lab } });
  if (!entry) return res.status(404).json({ error: "History entry not found." });
  const { EffectiveDate, Role, Category, Title, Detail } = req.body;
  if (Category && !ACHIEVEMENT_CATEGORIES.has(Category)) return res.status(400).json({ error: "Unsupported achievement category." });
  if (isRoleEvent(entry) && Role !== undefined && !PERSONNEL_ROLES.has(Role)) return res.status(400).json({ error: "A valid role is required for a role update." });
  try {
    await model.sequelize.transaction(async (transaction) => {
      await entry.update({
        EffectiveDate: EffectiveDate ? new Date(EffectiveDate) : entry.EffectiveDate,
        Role: Role ?? entry.Role, Category: Category ?? entry.Category,
        Title: Title?.trim?.() ?? entry.Title, Detail: Detail?.trim?.() ?? entry.Detail,
      }, { transaction });
      if (isRoleEvent(entry)) await syncCurrentPersonnelRole(model, context.member.id, transaction);
    });
    res.status(200).json(entry);
  } catch (error) { res.status(400).json({ error: "A valid effective date is required." }); }
});

exports.deleteHistory = asyncHandler(async (req, res) => {
  const context = await getTimelineMember(req, res);
  if (!context) return;
  if (!canManageHistory(context.requester)) return res.status(403).json({ error: "Only senior managers can manage personnel history." });
  const entry = await model.personnelHistory.findOne({ where: { id: req.params.entryId, FK_Personnel: context.member.id, FK_Lab: context.member.FK_Lab } });
  if (!entry) return res.status(404).json({ error: "History entry not found." });
  if (isRoleEvent(entry)) {
    const roleEventCount = await model.personnelHistory.count({
      where: {
        FK_Personnel: context.member.id,
        EventType: ["joined", "role_changed"],
        Role: { [Op.in]: [...PERSONNEL_ROLES] },
      },
    });
    if (roleEventCount <= 1) return res.status(400).json({ error: "A member must retain at least one role-history entry." });
  }
  await model.sequelize.transaction(async (transaction) => {
    await entry.destroy({ transaction });
    if (isRoleEvent(entry)) await syncCurrentPersonnelRole(model, context.member.id, transaction);
  });
  res.status(204).send();
});

// Delete a personnel with the specified id in the request
// The personnel will not be destroied, but labelled with "retried" in the database.
exports.delete = asyncHandler(async (req, res) => {

  // reset password
  const password = Math.random()
    .toString(36)
    .substring(2);

  const hashPassword = bcrypt.hashSync(password, 10);

  const personnel = await model.personnel.update({
    Password: hashPassword,
    Retired: true,
    Active: false
  },
    {
      where: { id: req.query.id }
    });

  // removed the personnel from assigned study 
  await model.experimenter.destroy({
    where: { FK_Experimenter: req.query.id }
  })

  // Log
  const User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;

  await log.createLog("Personnel Deleted", User, "removed (" +
  req.query.id + ") from the database");

  res.status(200).json(personnel);
  console.log(personnel.id + " deleted.");
});

// ─── GET PERSONNEL STATS ─────────────────────────────────────────────
// Retrieve all-time KPI stats (E1, E2, and Recruiting totals) for a specific user
exports.getStats = asyncHandler(async (req, res) => {
  const personnelId = Number(req.query.id);

  if (!Number.isInteger(personnelId) || personnelId <= 0) {
    return res.status(400).json({ error: "Personnel ID is required." });
  }

  try {
    // Count distinct appointments to avoid inflated totals if assignment rows are duplicated.
    const e1Count = await model.experimenterAssignment.count({
      where: { FK_Experimenter: personnelId },
      distinct: true,
      col: "FK_Appointment"
    });

    // Count distinct appointments to avoid inflated totals if assignment rows are duplicated.
    const e2Count = await model.experimenterAssignment_2nd.count({
      where: { FK_Experimenter: personnelId },
      distinct: true,
      col: "FK_Appointment"
    });

    // 3. Count how many schedules they created (Recruited)
    const scheduledCount = await model.schedule.count({
      where: { ScheduledBy: personnelId },
      distinct: true,
      col: "id"
    });

    res.status(200).json({
      e1Count,
      e2Count,
      scheduledCount
    });
  } catch (error) {
    console.error("Failed to fetch personnel stats:", error);
    res.status(500).json({ error: "Failed to fetch personnel stats." });
  }
});
