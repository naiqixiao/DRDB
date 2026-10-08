const { Op } = require("sequelize");
const moment = require("moment");
const log = require("../controllers/log");
const scheduleService = require("../services/scheduleService");
const momentTz = require("moment-timezone");
const { getEffectiveTimezone, getGeneralTimezone } = require("../services/timezoneService");
const model = require("../models/DRDB");

async function getLabSettings(labId) {
  const numericLabId = Number(labId);
  if (!Number.isInteger(numericLabId) || numericLabId <= 0) return {};

  const row = await model.systemSetting.findOne({
    where: { SettingKey: `LabSettings_${numericLabId}` },
  });

  if (!row?.SettingValue) return {};

  try {
    return JSON.parse(row.SettingValue);
  } catch (error) {
    return {};
  }
}

async function canUpdateCompletedConfirmedSchedules(labId) {
  const settings = await getLabSettings(labId);
  return settings.allowUpdateCompleted === true;
}

function isCompletedConfirmed(schedule) {
  return (
    schedule &&
    schedule.Status === "Confirmed" &&
    (schedule.Completed === true || schedule.Completed === 1)
  );
}

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
  const labId = req.body.lab || req.userData?.lab;
  const timeZone = await getEffectiveTimezone(labId);
  const schedule = await scheduleService.createSchedule(
    req.body,
    req.oAuth2Client,
    labId,
    timeZone
  );
  await log.createLog("Appointment Created", req.body.User, `added a study appointment to a schedule (${schedule.id})`);
  res.status(200).json(schedule);
});

// ─── UPDATE ─────────────────────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
  const existing = await model.schedule.findOne({
    where: { id: req.body.id },
    attributes: ["id", "Status", "Completed"],
  });

  if (isCompletedConfirmed(existing)) {
    const labId = req.body.lab || req.userData?.lab;
    const allowed = await canUpdateCompletedConfirmedSchedules(labId);
    if (!allowed) {
      return res.status(403).json({
        message: "Editing completed confirmed schedules is disabled by lab settings.",
      });
    }
  }

  const labId = req.body.lab || req.userData?.lab;
  const timeZone = await getEffectiveTimezone(labId);
  const schedule = await scheduleService.updateSchedule(
    req.body,
    req.oAuth2Client,
    labId,
    timeZone
  );
  
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
  // OnlineStudyOnly is intentionally not filtered here: these families already have a
  // schedule for a specific study, so follow-up must reach them whatever the study format.
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

// Public (unauthenticated) board shown on the login page so the department can
// allocate its participant parking spots. Only the minimum is exposed: caregiver
// first name + last initial, study/lab, and staff contacts. Online visits are
// dropped because they don't need parking.
const PARKING_BOARD_DAYS = 7;

function maskCaregiverName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Participant family";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function staffContact(person) {
  if (!person) return null;
  return { name: person.Name || null, email: person.Email || null, phone: person.Phone || null };
}

function toParkingVisits(schedules) {
  return schedules
    .map((schedule) => {
      const studies = (schedule.Appointments || [])
        .filter((appt) => appt.Study && appt.Study.StudyType !== "Online")
        .map((appt) => ({
          studyName: appt.Study.StudyName,
          studyType: appt.Study.StudyType,
          labId: appt.Study.Lab ? appt.Study.Lab.id : null,
          lab: appt.Study.Lab ? appt.Study.Lab.LabName : null,
          lead: staffContact(appt.Study.PointofContact),
          experimenter: staffContact((appt.PrimaryExperimenter || [])[0]),
        }));
      return {
        id: schedule.id,
        time: schedule.AppointmentTime,
        caregiver: maskCaregiverName(schedule.Family && schedule.Family.NamePrimary),
        studies,
      };
    })
    .filter((visit) => visit.studies.length > 0);
}

// PARKING_EXCLUDED_LABS: comma-separated lab names whose visits are shown on the
// board but don't use the shared participant parking (matched case-insensitively).
function parkingExcludedLabNames() {
  return (process.env.PARKING_EXCLUDED_LABS || "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function toParkingLabs(labs) {
  const excluded = parkingExcludedLabNames();
  return labs.map((lab) => ({
    id: lab.id,
    name: lab.LabName,
    countsForParking: !excluded.includes(String(lab.LabName || "").trim().toLowerCase()),
  }));
}

exports.maskCaregiverName = maskCaregiverName;
exports.toParkingVisits = toParkingVisits;
exports.toParkingLabs = toParkingLabs;

exports.parkingBoard = asyncHandler(async (req, res) => {
  const timeZone = await getGeneralTimezone();
  const start = momentTz.tz(timeZone).startOf("day");
  const end = start.clone().add(PARKING_BOARD_DAYS - 1, "days").endOf("day");
  const contactAttrs = ["id", "Name", "Email", "Phone"];

  const schedules = await model.schedule.findAll({
    where: {
      AppointmentTime: { [Op.between]: [start.toDate(), end.toDate()] },
      Status: "Confirmed",
      Completed: false,
      "$Family.TrainingSet$": false,
    },
    subQuery: false,
    include: [
      {
        model: model.appointment,
        attributes: ["id"],
        include: [
          {
            model: model.study,
            attributes: ["id", "StudyName", "StudyType"],
            include: [
              { model: model.lab, attributes: ["id", "LabName"] },
              { model: model.personnel, as: "PointofContact", attributes: contactAttrs },
            ],
          },
          { model: model.personnel, as: "PrimaryExperimenter", through: { attributes: [] }, attributes: contactAttrs },
        ],
      },
      { model: model.family, attributes: ["id", "NamePrimary"] },
    ],
    order: [["AppointmentTime", "ASC"]],
  });

  const labs = await model.lab.findAll({ attributes: ["id", "LabName"], order: [["id", "ASC"]] });

  res.status(200).send({ timeZone, labs: toParkingLabs(labs), visits: toParkingVisits(schedules) });
});

exports.remind = asyncHandler(async (req, res) => {
  await model.schedule.update({ Reminded: 1 }, { where: { id: req.body.id } });
  await log.createLog("Appointment Remind", req.body.User, `sent a reminding email for a study appointment (${req.body.id})`);
  res.status(200).send(await model.schedule.findOne({ where: { id: req.body.id } }));
});

exports.tyEmail = asyncHandler(async (req, res) => {
  const existing = await model.schedule.findOne({
    where: { id: req.body.id },
    attributes: ["id", "Status", "Completed"],
  });

  if (isCompletedConfirmed(existing)) {
    const labId = req.body.lab || req.userData?.lab;
    const allowed = await canUpdateCompletedConfirmedSchedules(labId);
    if (!allowed) {
      return res.status(403).json({
        message: "Editing completed confirmed schedules is disabled by lab settings.",
      });
    }
  }

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
