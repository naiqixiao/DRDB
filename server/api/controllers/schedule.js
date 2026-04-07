const { Op } = require("sequelize");
const moment = require("moment");
const log = require("../controllers/log");
const scheduleService = require("../services/scheduleService");
const model = require("../models/DRDB");

function parsePagination(query) {
  const requestedLimit = Number.parseInt(query.limit, 10);
  const requestedOffset = Number.parseInt(query.offset, 10);

  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 200)
    : 100;
  const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0
    ? requestedOffset
    : 0;

  return { limit, offset };
}

// Temporary wrapper to log exact errors!
const asyncHandler = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(err => {
    console.error("----- ASYNC HANDLER CAUGHT AN ERROR -----");
    console.error(err);
    next(err);
  });
};

// ─── CREATE ─────────────────────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule(req.body, req.oAuth2Client, req.body.lab);
  await log.createLog("Appointment Created", req.body.User, `added a study appointment to a schedule (${schedule.id})`);
  res.status(200).json(schedule);
});

// ─── UPDATE ─────────────────────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule(req.body, req.oAuth2Client, req.body.lab);
  
  await log.createLog("Appointment Updated", req.body.User, `updated a study appointment (${schedule.id})`);
  res.status(200).send(schedule);
});

// ─── SEARCH ─────────────────────────────────────────────────────────────
exports.search = asyncHandler(async (req, res) => {
  const queryString = { ...req.query };
  const pagination = parsePagination(req.query);
  
  if (queryString.AppointmentTimeAfter && queryString.AppointmentTimeBefore) {
    queryString.AppointmentTime = {
      [Op.between]: [new Date(queryString.AppointmentTimeAfter), new Date(queryString.AppointmentTimeBefore)]
    };
  } else if (queryString.AppointmentTimeAfter) {
    queryString.AppointmentTime = { [Op.gte]: new Date(queryString.AppointmentTimeAfter) };
  } else if (queryString.AppointmentTimeBefore) {
    queryString.AppointmentTime = { [Op.lte]: new Date(queryString.AppointmentTimeBefore) };
  }
  if (queryString.trainingMode === "true") queryString["$Family.TrainingSet$"] = true;
  else queryString["$Family.TrainingSet$"] = false;

  delete queryString.AppointmentTimeBefore;
  delete queryString.AppointmentTimeAfter;
  delete queryString.trainingMode;
  delete queryString.limit;
  delete queryString.offset;
  
  if (queryString.Email) {
    queryString["$Family.Email$"] = { [Op.like]: `${queryString.Email}%` };
  }
  delete queryString.Email;
  if (queryString.NamePrimary) {
    queryString["$Family.NamePrimary$"] = { [Op.like]: `${queryString.NamePrimary}%` };
  }
  delete queryString.NamePrimary;
  if (queryString.NameSecondary) {
    queryString["$Family.NameSecondary$"] = { [Op.like]: `${queryString.NameSecondary}%` };
  }
  delete queryString.NameSecondary;
  if (queryString.Phone) {
    queryString["$Family.Phone$"] = { [Op.like]: `${queryString.Phone}%` };
  }
  delete queryString.Phone;
  if (queryString.StudyName) { queryString["$Appointments.FK_Study$"] = queryString.StudyName; }
  delete queryString.StudyName;
  if (queryString.StudyId) { queryString["$Appointments.FK_Study$"] = queryString.StudyId; }
  delete queryString.StudyId;
  if (queryString.lab) { queryString["$Appointments.Study.FK_Lab$"] = queryString.lab; }
  delete queryString.lab;

  if (queryString.FamilyId) { queryString.FK_Family = queryString.FamilyId; }
  delete queryString.FamilyId;

  // Strip empty array filters — Sequelize translates [] to `IN ()` which is invalid SQL.
  if (Array.isArray(queryString.Status) && queryString.Status.length === 0) delete queryString.Status;
  if (Array.isArray(queryString["$Appointments.FK_Study$"]) && queryString["$Appointments.FK_Study$"].length === 0) delete queryString["$Appointments.FK_Study$"];

  const result = await scheduleService.searchSchedulesWithPagination(queryString, pagination);
  res.status(200).send(result);
});

exports.today = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const queryString = {
    AppointmentTime: { [Op.between]: [moment().startOf("day").toDate(), moment().startOf("day").add(1, "days").toDate()] },
    "$Family.TrainingSet$": req.query.trainingMode === "true",
  };
  if (req.query.lab) queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  
  const result = await scheduleService.searchSchedulesWithPagination(queryString, pagination);
  res.status(200).send(result);
});

exports.tomorrow = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const endDate = moment().day() >= 5 ? moment().add(1, "weeks").weekday(2).startOf("day").toDate() : moment().add(2, "days").startOf("day").toDate();

  const queryString = {
    AppointmentTime: { [Op.between]: [moment().add(1, "days").startOf("day").toDate(), endDate] },
    "$Family.TrainingSet$": req.query.trainingMode === "true",
  };
  if (req.query.lab) queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  
  const result = await scheduleService.searchSchedulesWithPagination(queryString, pagination);
  res.status(200).send(result);
});

exports.week = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const queryString = {
    AppointmentTime: { [Op.between]: [moment().weekday(0).startOf("day").toDate(), moment().weekday(7).startOf("day").toDate()] },
    "$Family.TrainingSet$": req.query.trainingMode === "true",
  };
  if (req.query.lab) queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  const result = await scheduleService.searchSchedulesWithPagination(queryString, pagination);
  res.status(200).send(result);
});

exports.searchFollowUps = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const queryString = {
    "$Family.NextContactDate$": { [Op.or]: [{ [Op.lte]: moment().startOf("day").toDate() }, { [Op.eq]: null }] },
    "$Family.NoMoreContact$": 0,
    Status: { [Op.in]: ["TBD", "Rescheduling", "No Show"] },
    "$Family.TrainingSet$": req.query.trainingMode === "true",
  };
  // Filter by lab via the appointment's study, not AssignedLab.
  // Families that "No Showed" have AssignedLab cleared by updateSchedule,
  // so using AssignedLab here would exclude all the families that need follow-up.
  if (req.query.lab) queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  const result = await scheduleService.searchSchedulesWithPagination(queryString, pagination);
  res.status(200).send(result);
});

exports.upcoming = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 7;
  const queryString = {
    AppointmentTime: { [Op.gte]: moment().toDate() },
    Status: "Confirmed",
    Completed: false,
    "$Family.TrainingSet$": req.query.trainingMode === "true",
  };
  if (req.query.lab) queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;

  const schedules = await model.schedule.findAll({
    where: queryString,
    subQuery: false,
    include: [
      {
        model: model.appointment,
        include: [
          { model: model.child, attributes: ["id", "Name", "DoB", "Age", "Sex"] },
          {
            model: model.study,
            attributes: ["id", "StudyName", "FK_TestingRoom", "StudyType", "EmailTemplate", "ReminderTemplate"],
          },
          { model: model.personnel, as: "PrimaryExperimenter", through: { model: model.experimenterAssignment }, attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"] },
          { model: model.personnel, as: "SecondaryExperimenter", through: { model: model.experimenterAssignment_2nd }, attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"] },
        ],
      },
      { model: model.family, attributes: ["id", "NamePrimary", "NameSecondary", "Phone", "Email"] }
    ],
    order: [["AppointmentTime", "ASC"]],
    limit: limit,
  });

  res.status(200).send(schedules);
});

exports.remind = asyncHandler(async (req, res) => {
  await model.schedule.update({ Reminded: 1 }, { where: { id: req.body.id } });
  await log.createLog("Appointment Remind", req.body.User, `sent a reminding email for a study appointment (${req.body.id})`);
  res.status(200).send(await model.schedule.findOne({ where: { id: req.body.id } }));
});

exports.tyEmail = asyncHandler(async (req, res) => {
  await model.schedule.update(req.body, { where: { id: req.body.id } });
  await log.createLog("Appointment update", req.body.User, `sent a thank you email for study schedule (${req.body.id})`);
  res.status(200).send(await model.schedule.findOne({ where: { id: req.body.id } }));
});

exports.complete = asyncHandler(async (req, res) => {
  await model.schedule.update(req.body, { where: { id: req.body.id } });
  await model.family.update({ AssignedLab: null }, { where: { id: req.body.FK_Family } });
  
  await log.createLog("Appointment Complete", req.body.User, `marked the study appointment (${req.body.id}) as completed`);
  res.status(200).send(await model.schedule.findOne({ where: { id: req.body.id } }));
});

exports.delete = asyncHandler(async (req, res) => {
  await scheduleService.deleteSchedule(req.query.id, req.oAuth2Client);
  let User = typeof req.query.User === 'string' ? JSON.parse(req.query.User) : req.query.User;
  await log.createLog("Appointment Delete", User, `deleted a study appointment (${req.query.id})`);
  res.status(200).send("schedule deleted.");
});

exports.special = asyncHandler(async (req, res) => {
  const schedules = await scheduleService.searchSchedules(
    { "$Appointments.Study.FK_Lab$": 2 },
    { disablePagination: true }
  );
  
  for (const schedule of schedules) {
    for (const appointment of schedule.Appointments) {
      await model.appointment.update({ FK_Family: schedule.FK_Family }, { where: { id: appointment.id } });
    }
  }
  res.status(200).send(schedules);
});
