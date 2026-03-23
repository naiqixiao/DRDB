/**
 * Reminder Service
 *
 * Data queries and business logic for reminder emails.
 * Extracted from controllers/reminder.js for maintainability.
 */

const model = require("../models/DRDB");
const { Op } = require("sequelize");
const moment = require("moment");

/**
 * Get schedules for auto-completion reminders.
 * Returns a list grouped by primary experimenter:
 * [{ experimenterName, experimenterEmail, scheduleList: [...] }, ...]
 */
async function getCompletionReminderData() {
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
  };

  const schedules = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.study,
            include: [
              { model: model.lab },
              {
                model: model.personnel,
                as: "Experimenters",
                through: { model: model.experimenter },
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
        ],
      },
      {
        model: model.family,
        attributes: ["id", "NamePrimary", "Email"],
      },
      {
        model: model.personnel,
      },
    ],
  });

  // Deduplicate primary experimenters
  var primaryExperimenters = schedules.map((schedule) => ({
    id: schedule.Appointments[0].PrimaryExperimenter[0].id,
    Name: schedule.Appointments[0].PrimaryExperimenter[0].Name,
    Email: schedule.Appointments[0].PrimaryExperimenter[0].Email,
  }));

  primaryExperimenters = primaryExperimenters.filter(
    (experimenter, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.id === experimenter.id &&
          e.Name === experimenter.Name &&
          e.Email === experimenter.Email
      )
  );

  // Group schedules by primary experimenter
  const autoCompletionList = primaryExperimenters.map((experimenter) => {
    const reminderList = {
      experimenterName: experimenter.Name,
      experimenterEmail: experimenter.Email,
      scheduleList: [],
    };

    schedules.forEach((schedule) => {
      if (
        schedule.Appointments[0].PrimaryExperimenter[0].id === experimenter.id
      ) {
        reminderList.scheduleList.push({
          id: schedule.id,
          Email: schedule.Family.Email,
          Name: schedule.Family.NamePrimary,
          StudyName: schedule.Appointments[0].Study.StudyName,
          AppointmentTime: schedule.AppointmentTime,
          LabName: schedule.Appointments[0].Study.Lab.LabName,
          LabEmail: schedule.Appointments[0].Study.Lab.Email,
          LabID: schedule.Appointments[0].Study.Lab.id,
        });
      }
    });

    return reminderList;
  });

  return { autoCompletionList, schedules, primaryExperimenters };
}

/**
 * Get schedules for auto-rejection/follow-up reminders.
 * Returns a list grouped by the researcher who last contacted:
 * [{ researcherName, researcherEmail, scheduleList: [...] }, ...]
 */
async function getRejectionReminderData() {
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
  };

  const schedules = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.study,
            include: [
              { model: model.lab },
              {
                model: model.personnel,
                as: "Experimenters",
                through: { model: model.experimenter },
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
        ],
      },
      {
        model: model.family,
        attributes: ["id", "NamePrimary", "Email"],
      },
      {
        model: model.personnel,
      },
    ],
  });

  // Deduplicate contact researchers
  var contactResearchers = schedules.map((schedule) => ({
    id: schedule.Personnel.id,
    Name: schedule.Personnel.Name,
    Email: schedule.Personnel.Email,
  }));

  contactResearchers = contactResearchers.filter(
    (experimenter, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.id === experimenter.id &&
          e.Name === experimenter.Name &&
          e.Email === experimenter.Email
      )
  );

  // Group schedules by contact researcher
  const autoRejectionList = contactResearchers.map((researcher) => {
    const reminderList = {
      researcherName: researcher.Name,
      researcherEmail: researcher.Email,
      scheduleList: [],
    };

    schedules.forEach((schedule) => {
      if (schedule.Personnel.id === researcher.id) {
        reminderList.scheduleList.push({
          id: schedule.id,
          Email: schedule.Family.Email,
          Name: schedule.Family.NamePrimary,
          AppointmentTime: schedule.AppointmentTime,
          Status: schedule.Status,
          StudyName: schedule.Appointments[0].Study.StudyName,
          LabName: schedule.Appointments[0].Study.Lab.LabName,
          LabEmail: schedule.Appointments[0].Study.Lab.Email,
          LabID: schedule.Appointments[0].Study.Lab.id,
          updatedAt: schedule.updatedAt,
        });
      }
    });

    return reminderList;
  });

  return { autoRejectionList, schedules, contactResearchers };
}

/**
 * Get tomorrow's confirmed family schedules for reminder emails.
 */
async function getFamilyReminderSchedules() {
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
  };

  return model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.child,
            attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
          },
          {
            model: model.study,
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
      },
      {
        model: model.personnel,
      },
    ],
  });
}

/**
 * Get experimenters who have confirmed studies tomorrow.
 */
async function getExperimenterReminderData() {
  return model.personnel.findAll({
    where: {
      [Op.or]: [
        {
          "$PrimaryExperimenterof.Schedule.AppointmentTime$": {
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
        {
          "$SecondaryExperimenterof.Schedule.AppointmentTime$": {
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
      ],
      [Op.or]: [
        { "$PrimaryExperimenterof.Schedule.Status$": "Confirmed" },
        { "$SecondaryExperimenterof.Schedule.Status$": "Confirmed" },
      ],
      [Op.or]: [
        { "$PrimaryExperimenterof.Child.Family.TrainingSet$": false },
        { "$SecondaryExperimenterof.Child.Family.TrainingSet$": false },
      ],
    },
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
          { model: model.study },
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
          { model: model.study },
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
