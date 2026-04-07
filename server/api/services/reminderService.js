/**
 * Reminder Service
 *
 * Data queries and business logic for reminder emails.
 * Extracted from controllers/reminder.js for maintainability.
 */

const model = require("../models/DRDB");
const { Op, literal } = require("sequelize");
const moment = require("moment");

function getStudyWhereFilter(labId) {
  if (!Number.isInteger(labId)) {
    return undefined;
  }
  return { FK_Lab: labId };
}

// Returns a Sequelize literal that checks whether a Schedule has at least one
// Appointment linked to a Study in the given lab.  Avoids putting a `where`
// condition on a deeply-nested include inside fetchSchedulesInBatches, which
// causes Sequelize v5 to generate a broken subquery (Appointments.FK_Study
// referenced before the Appointment table is joined).
function getLabExistsLiteral(labId) {
  if (!Number.isInteger(labId)) return null;
  // labId is validated as an integer above, so interpolation is safe.
  return literal(
    `EXISTS (SELECT 1 FROM \`Appointment\` \`_a\`
      INNER JOIN \`Study\` \`_s\` ON \`_a\`.\`FK_Study\` = \`_s\`.\`id\`
      WHERE \`_a\`.\`FK_Schedule\` = \`Schedule\`.\`id\`
        AND \`_s\`.\`FK_Lab\` = ${labId})`
  );
}

function getExperimenterHasAppointmentsLiteral(labId) {
  const tomorrowStart = moment().startOf("day").add(1, "days").format("YYYY-MM-DD HH:mm:ss");
  const tomorrowEnd = moment().startOf("day").add(2, "days").format("YYYY-MM-DD HH:mm:ss");
  
  const labCondition = Number.isInteger(labId) ? `AND \`_s\`.\`FK_Lab\` = ${labId}` : "";
  
  return literal(
    `EXISTS (
      SELECT 1 FROM \`Appointment\` \`_a\`
      INNER JOIN \`Schedule\` \`_sc\` ON \`_a\`.\`FK_Schedule\` = \`_sc\`.\`id\`
      INNER JOIN \`Study\` \`_s\` ON \`_a\`.\`FK_Study\` = \`_s\`.\`id\`
      INNER JOIN \`Child\` \`_c\` ON \`_a\`.\`FK_Child\` = \`_c\`.\`id\`
      INNER JOIN \`Family\` \`_f\` ON \`_c\`.\`FK_Family\` = \`_f\`.\`id\`
      LEFT JOIN \`ExperimenterAssignment\` \`_ea\` ON \`_a\`.\`id\` = \`_ea\`.\`FK_Appointment\`
      LEFT JOIN \`SecondExperimenterAssignment\` \`_sea\` ON \`_a\`.\`id\` = \`_sea\`.\`FK_Appointment\`
      WHERE (\`_ea\`.\`FK_Experimenter\` = \`Personnel\`.\`id\` OR \`_sea\`.\`FK_Experimenter\` = \`Personnel\`.\`id\`)
        AND \`_sc\`.\`AppointmentTime\` BETWEEN '${tomorrowStart}' AND '${tomorrowEnd}'
        AND \`_sc\`.\`Status\` = 'Confirmed'
        AND \`_f\`.\`TrainingSet\` = 0
        ${labCondition}
    )`
  );
}

const REMINDER_BATCH_SIZE = 200;

async function fetchSchedulesInBatches({ where, include, order = [["id", "ASC"]] }) {
  const schedules = [];
  let offset = 0;

  while (true) {
    const batch = await model.schedule.findAll({
      attributes: ["id", "AppointmentTime", "Status", "updatedAt"],
      where,
      include,
      order,
      subQuery: false,
      limit: REMINDER_BATCH_SIZE,
      offset,
    });

    if (batch.length === 0) {
      break;
    }

    schedules.push(...batch);

    if (batch.length < REMINDER_BATCH_SIZE) {
      break;
    }

    offset += REMINDER_BATCH_SIZE;
  }

  return schedules;
}

async function fetchPersonnelInBatches({ where, include, order = [["id", "ASC"]] }) {
  const results = [];
  let offset = 0;
  while (true) {
    const batch = await model.personnel.findAll({
      where,
      include,
      order,
      limit: REMINDER_BATCH_SIZE,
      offset,
    });
    if (batch.length === 0) break;
    results.push(...batch);
    if (batch.length < REMINDER_BATCH_SIZE) break;
    offset += REMINDER_BATCH_SIZE;
  }
  return results;
}

/**
 * Get schedules for auto-completion reminders.
 * Returns a list grouped by primary experimenter:
 * [{ experimenterName, experimenterEmail, scheduleList: [...] }, ...]
 */
async function getCompletionReminderData(labId) {
  const labExists = getLabExistsLiteral(labId);
  const queryString = {
    Status: "Confirmed",
    Completed: false,
    AppointmentTime: {
      [Op.between]: [
        moment()
          .subtract(1, "days")
          .startOf("day")
          .toDate(),
        moment()
          .startOf("day")
          .toDate(),
      ],
    },
    ...(labExists && { [Op.and]: [labExists] }),
  };

  const schedules = await fetchSchedulesInBatches({
    where: queryString,
    include: [
      {
        model: model.appointment,
        required: true,
        attributes: ["id", "FK_Study"],
        include: [
          {
            model: model.study,
            required: true,
            attributes: ["id", "StudyName", "FK_Lab"],
            include: [
              { model: model.lab, attributes: ["id", "LabName", "Email"] },
            ],
          },
          {
            model: model.personnel,
            as: "PrimaryExperimenter",
            through: { model: model.experimenterAssignment },
            attributes: ["id", "Name", "Email"],
          },
        ],
      },
      {
        model: model.family,
        attributes: ["id", "NamePrimary", "Email"],
      },
    ],
  });

  const completionByExperimenter = new Map();

  schedules.forEach((schedule) => {
    const appointment = schedule.Appointments && schedule.Appointments[0];
    const study = appointment && appointment.Study;
    const primary = appointment && appointment.PrimaryExperimenter && appointment.PrimaryExperimenter[0];

    if (!study || !primary || !study.Lab) {
      console.warn(`Skipping schedule ${schedule.id}: missing study/experimenter data`);
      return;
    }

    const key = String(primary.id);
    if (!completionByExperimenter.has(key)) {
      completionByExperimenter.set(key, {
        id: primary.id,
        experimenterName: primary.Name,
        experimenterEmail: primary.Email,
        scheduleList: [],
      });
    }

    completionByExperimenter.get(key).scheduleList.push({
      id: schedule.id,
      Email: schedule.Family && schedule.Family.Email,
      Name: schedule.Family && schedule.Family.NamePrimary,
      StudyName: study.StudyName,
      AppointmentTime: schedule.AppointmentTime,
      LabName: study.Lab.LabName,
      LabEmail: study.Lab.Email,
      LabID: study.Lab.id,
    });
  });

  const autoCompletionList = Array.from(completionByExperimenter.values()).filter(
    (entry) => entry.scheduleList.length > 0
  );
  const primaryExperimenters = autoCompletionList.map((entry) => ({
    id: entry.id,
    Name: entry.experimenterName,
    Email: entry.experimenterEmail,
  }));

  return { autoCompletionList, schedules, primaryExperimenters };
}

/**
 * Get schedules for auto-rejection/follow-up reminders.
 * Returns a list grouped by the researcher who last contacted:
 * [{ researcherName, researcherEmail, scheduleList: [...] }, ...]
 */
async function getRejectionReminderData(labId) {
  const labExists = getLabExistsLiteral(labId);
  const queryString = {
    Status: { [Op.in]: ["TBD", "Rescheduling", "No Show", "Cancelled"] },
    Completed: false,
    updatedAt: {
      [Op.between]: [
        moment()
          .subtract(7, "days")
          .startOf("day")
          .toDate(),
        moment()
          .subtract(6, "days")
          .startOf("day")
          .toDate(),
      ],
    },
    ...(labExists && { [Op.and]: [labExists] }),
  };

  const schedules = await fetchSchedulesInBatches({
    where: queryString,
    include: [
      {
        model: model.appointment,
        required: true,
        attributes: ["id", "FK_Study"],
        include: [
          {
            model: model.study,
            required: true,
            attributes: ["id", "StudyName", "FK_Lab"],
            include: [
              { model: model.lab, attributes: ["id", "LabName", "Email"] },
            ],
          },
        ],
      },
      {
        model: model.family,
        attributes: ["id", "NamePrimary", "Email"],
      },
      {
        model: model.personnel,
        required: true,
        attributes: ["id", "Name", "Email"],
      },
    ],
  });

  const rejectionByResearcher = new Map();

  schedules.forEach((schedule) => {
    const researcher = schedule.Personnel;
    const appointment = schedule.Appointments && schedule.Appointments[0];
    const study = appointment && appointment.Study;

    if (!researcher || !study || !study.Lab) {
      console.warn(`Skipping schedule ${schedule.id}: missing researcher/study data`);
      return;
    }

    const key = String(researcher.id);
    if (!rejectionByResearcher.has(key)) {
      rejectionByResearcher.set(key, {
        id: researcher.id,
        researcherName: researcher.Name,
        researcherEmail: researcher.Email,
        scheduleList: [],
      });
    }

    rejectionByResearcher.get(key).scheduleList.push({
      id: schedule.id,
      Email: schedule.Family && schedule.Family.Email,
      Name: schedule.Family && schedule.Family.NamePrimary,
      AppointmentTime: schedule.AppointmentTime,
      Status: schedule.Status,
      StudyName: study.StudyName,
      LabName: study.Lab.LabName,
      LabEmail: study.Lab.Email,
      LabID: study.Lab.id,
      updatedAt: schedule.updatedAt,
    });
  });

  const autoRejectionList = Array.from(rejectionByResearcher.values()).filter(
    (entry) => entry.scheduleList.length > 0
  );
  const contactResearchers = autoRejectionList.map((entry) => ({
    id: entry.id,
    Name: entry.researcherName,
    Email: entry.researcherEmail,
  }));

  return { autoRejectionList, schedules, contactResearchers };
}

/**
 * Get tomorrow's confirmed family schedules for reminder emails.
 */
async function getFamilyReminderSchedules(labId) {
  const labExists = getLabExistsLiteral(labId);
  const queryString = {
    AppointmentTime: {
      [Op.between]: [
        moment()
          .startOf("day")
          .add(1, "days")
          .toDate(),
        moment()
          .startOf("day")
          .add(2, "days")
          .toDate(),
      ],
    },
    Reminded: 0,
    Status: "Confirmed",
    "$Family.TrainingSet$": false,
    ...(labExists && { [Op.and]: [labExists] }),
  };

  const schedules = await fetchSchedulesInBatches({
    where: queryString,
    include: [
      {
        model: model.appointment,
        required: true,
        include: [
          {
            model: model.child,
            attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
          },
          {
            model: model.study,
            required: true,
            attributes: [
              "StudyName",
              "EmailTemplate",
              "ReminderTemplate",
              "FollowUPEmailSnippet",
              "StudyType",
              "FK_Lab",
            ],
            include: [
              { model: model.lab },
              { model: model.studyAgeGroup, as: 'AgeGroups' },
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
      },
      {
        model: model.family,
        required: true,
      },
      {
        model: model.personnel,
      },
    ],
  });

  return schedules
    .map((schedule) => {
      if (!Array.isArray(schedule.Appointments)) {
        return schedule;
      }

      schedule.Appointments = schedule.Appointments.filter(
        (appointment) => appointment && appointment.Study
      );

      return schedule;
    })
    .filter((schedule) => schedule.Appointments && schedule.Appointments.length > 0);
}

/**
 * Get experimenters who have confirmed studies tomorrow.
 */
async function getExperimenterReminderData(labId) {
  const studyWhere = getStudyWhereFilter(labId);
  const experimenterExists = getExperimenterHasAppointmentsLiteral(labId);
  
  const where = Number.isInteger(labId)
    ? { 
        FK_Lab: labId,
        [Op.and]: [experimenterExists] 
      }
    : {
        [Op.and]: [experimenterExists]
      };

  return fetchPersonnelInBatches({
    where,
    include: [
      model.lab,
      {
        model: model.appointment,
        as: "PrimaryExperimenterof",
        through: { model: model.experimenterAssignment },
        include: [
          {
            model: model.schedule,
            where: {
              AppointmentTime: {
                [Op.between]: [
                  moment()
                    .startOf("day")
                    .add(1, "days")
                    .toDate(),
                  moment()
                    .startOf("day")
                    .add(2, "days")
                    .toDate(),
                ],
              },
            },
          },
          { model: model.study, where: studyWhere },
          {
            model: model.child,
            include: [
              {
                model: model.family,
                where: { TrainingSet: false },
              },
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
      },
      {
        model: model.appointment,
        as: "SecondaryExperimenterof",
        through: { model: model.experimenterAssignment_2nd },
        include: [
          {
            model: model.schedule,
            where: {
              AppointmentTime: {
                [Op.between]: [
                  moment()
                    .startOf("day")
                    .add(1, "days")
                    .toDate(),
                  moment()
                    .startOf("day")
                    .add(2, "days")
                    .toDate(),
                ],
              },
            },
          },
          { model: model.study, where: studyWhere },
          {
            model: model.child,
            include: [
              {
                model: model.family,
                where: { TrainingSet: false },
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
      },
    ],
    order: [
      [
        { model: model.appointment, as: "PrimaryExperimenterof" },
        { model: model.schedule },
        "AppointmentTime",
        "ASC",
      ],
      [
        { model: model.appointment, as: "SecondaryExperimenterof" },
        { model: model.schedule },
        "AppointmentTime",
        "ASC",
      ],
    ],
  });
}

module.exports = {
  getCompletionReminderData,
  getRejectionReminderData,
  getFamilyReminderSchedules,
  getExperimenterReminderData,
};
