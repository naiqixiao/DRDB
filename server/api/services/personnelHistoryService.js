const EVENT_TYPES = new Set([
  "joined", "role_changed", "project_started", "project_ended",
  "leadership_started", "leadership_ended", "achievement_note"
]);

const ACHIEVEMENT_CATEGORIES = new Set([
  "Award", "Scholarship", "Presentation", "Publication", "Grant", "Certification", "Other"
]);

const { Op } = require("sequelize");

const PERSONNEL_ROLES = new Set([
  "Admin", "PostDoc", "PI", "GradStudent", "Undergrad", "RA", "Lab manager", "Staff"
]);

function dateOrNow(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("A valid effective date is required.");
  return date;
}

async function recordPersonnelHistory(model, values, options = {}) {
  if (!EVENT_TYPES.has(values.EventType)) throw new Error("Unsupported personnel history event type.");
  return model.personnelHistory.create({ ...values, EffectiveDate: dateOrNow(values.EffectiveDate) }, options);
}

function isRoleEvent(entry) {
  return ["joined", "role_changed"].includes(entry.EventType);
}

async function syncCurrentPersonnelRole(model, personnelId, transaction) {
  const latestRoleEntry = await model.personnelHistory.findOne({
    where: {
      FK_Personnel: personnelId,
      EventType: ["joined", "role_changed"],
      Role: { [Op.in]: [...PERSONNEL_ROLES] },
    },
    order: [["EffectiveDate", "DESC"], ["id", "DESC"]],
    transaction,
  });

  if (!latestRoleEntry || !PERSONNEL_ROLES.has(latestRoleEntry.Role)) return null;
  await model.personnel.update({ Role: latestRoleEntry.Role }, { where: { id: personnelId }, transaction });
  return latestRoleEntry;
}

async function reconcilePersonnelRoles(model) {
  const personnel = await model.personnel.findAll({ attributes: ["id"], raw: true });
  await model.sequelize.transaction(async (transaction) => {
    for (const person of personnel) await syncCurrentPersonnelRole(model, person.id, transaction);
  });
}

async function seedPersonnelHistoryBaseline(model) {
  const existingCount = await model.personnelHistory.count();
  if (existingCount > 0) return;

  await model.sequelize.transaction(async (transaction) => {
    const personnel = await model.personnel.findAll({ transaction });
    if (personnel.length > 0) {
      await model.personnelHistory.bulkCreate(personnel.map((person) => ({
        FK_Personnel: person.id, FK_Lab: person.FK_Lab, EventType: "joined",
        EffectiveDate: person.createdAt || new Date(), Role: person.Role, Imported: 1
      })), { transaction });
    }

    const assignments = await model.experimenter.findAll({ transaction });
    if (assignments.length > 0) {
      const studyIds = [...new Set(assignments.map((item) => item.FK_Study))];
      const studies = await model.study.findAll({ where: { id: studyIds }, transaction });
      const studiesById = new Map(studies.map((study) => [study.id, study]));
      const rows = assignments.filter((item) => studiesById.has(item.FK_Study)).map((item) => {
        const study = studiesById.get(item.FK_Study);
        return {
        FK_Personnel: item.FK_Experimenter, FK_Lab: study.FK_Lab,
        EventType: "project_started", EffectiveDate: item.createdAt || new Date(),
        FK_Study: item.FK_Study, StudyName: study.StudyName, Imported: 1
      }; });
      if (rows.length) await model.personnelHistory.bulkCreate(rows, { transaction });
    }

    const studies = await model.study.findAll({ transaction });
    if (studies.length) await model.personnelHistory.bulkCreate(studies.map((study) => ({
      FK_Personnel: study.FK_Personnel, FK_Lab: study.FK_Lab,
      EventType: "leadership_started", EffectiveDate: study.createdAt || new Date(),
      FK_Study: study.id, StudyName: study.StudyName, Imported: 1
    })), { transaction });
  });
}

module.exports = {
  EVENT_TYPES,
  ACHIEVEMENT_CATEGORIES,
  PERSONNEL_ROLES,
  isRoleEvent,
  recordPersonnelHistory,
  syncCurrentPersonnelRole,
  reconcilePersonnelRoles,
  seedPersonnelHistoryBaseline,
};
