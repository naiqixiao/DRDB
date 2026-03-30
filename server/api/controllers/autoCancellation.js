const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const log = require("../controllers/log");

// if we don't follow up with the pending families for two weeks, we will release them. And the schedule will be marked as rejected.

exports.autoCancellation = asyncHandler(async (req, res) => {
  // mark TBD & Rescheduling appointments scheduled two weeks ago as rejected.
  var queryString = {};
  const User = {
    Name: "",
    Email: "",
    LabName: "",
  };

  // search study appointments whose families have not been updated for two weeks.
  // these appointmets will be marked as rejected.
  queryString["$Family.NextContactDate$"] = {
    [Op.lte]: moment()
      .subtract(2, "w")
      .toDate(),
  };

  queryString.Status = { [Op.in]: ["TBD", "Rescheduling"] };

  try {
    const schedules = await model.schedule.findAll({
      attributes: ["id", "FK_Family"],
      raw: true,
      where: queryString,
    });

    const scheduleIds = schedules.map((schedule) => schedule.id);
    if (scheduleIds.length > 0) {
      await model.schedule.update(
        {
          Status: "Rejected",
          Completed: true,
        },
        { where: { id: { [Op.in]: scheduleIds } } }
      );

      await log.createLog(
        "Auto cancellation",
        User,
        "marked " +
          scheduleIds.length +
          " schedules as Rejected due to lack of update for two weeks."
      );
    }

    // release the families.
    const familyIds = Array.from(
      new Set(
        schedules
          .map((schedule) => schedule.FK_Family)
          .filter((id) => id !== null && id !== undefined)
      )
    );

    if (familyIds.length > 0) {
      // update family by removing AssignedLab from the family
      const updateFamilyInfo = { AssignedLab: null };

      await model.family.update(updateFamilyInfo, {
        where: { id: familyIds },
      });

      // Log
      await log.createLog(
        "Family Lab Assisgnment Release",
        {},
        "Families (" +
          familyIds.join(", ") +
          ") were no longer assigned to any lab due to auto cancellation."
      );
    }

    // res.status(200).send(schedules);
  } catch (error) {
    console.error("Auto-cancellation error:", error);
  }
});

exports.autoCompletion = asyncHandler(async (req, res) => {
  var queryString = {};
  // const User = {
  //   Name: "",
  //   Email: "",
  //   LabName: "",
  // };

  // 1. search study appointments whose schedule time has passed but are yet marked as completed.
  // appointment time was 2 days before the current date.
  queryString.Status = "Confirmed";
  queryString.Completed = 0;
  queryString.AppointmentTime = {
    [Op.lt]: moment()
      .subtract(2, "days")
      .startOf("day")
      .toDate(),
  };

  try {
    const schedules1 = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      where: queryString,
    });

    const schedule1Ids = schedules1.map((schedule) => schedule.id);
    if (schedule1Ids.length > 0) {
      await model.schedule.update(
        {
          Completed: 1,
        },
        { where: { id: { [Op.in]: schedule1Ids } } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked " +
          schedule1Ids.length +
          " schedules as Completed due to elapsed appointment time."
      );
    }

    // 2. search for appointments with **Tentative** status, if the last contacted date was 2 weeks ago, mark them as rejected, and completed.
    queryString = {};
    queryString.Status = {
      [Op.in]: ["TBD", "Rescheduling", "No Show", "Cancelled"],
    };
    queryString.Completed = 0;
    queryString.updatedAt = {
      [Op.lt]: moment()
        .subtract(13, "days")
        .startOf("day")
        .toDate(),
    };

    const schedules2 = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      where: queryString,
    });

    const schedule2Ids = schedules2.map((schedule) => schedule.id);
    if (schedule2Ids.length > 0) {
      await model.schedule.update(
        {
          Status: "Rejected",
          Completed: true,
        },
        { where: { id: { [Op.in]: schedule2Ids } } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked " +
          schedule2Ids.length +
          " stale schedules as Rejected and Completed."
      );
    }

    // 3. search for appointments with **Rejected** status, mark them as completed.
    queryString = {};
    queryString.Status = "Rejected";
    queryString.Completed = false;

    const schedules3 = await model.schedule.findAll({
      attributes: ["id"],
      raw: true,
      where: queryString,
    });

    const schedule3Ids = schedules3.map((schedule) => schedule.id);
    if (schedule3Ids.length > 0) {
      await model.schedule.update(
        {
          Completed: true,
        },
        { where: { id: { [Op.in]: schedule3Ids } } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked " +
          schedule3Ids.length +
          " rejected schedules as Completed."
      );
    }

    if (res) {
      res.status(200).send({
        schedule1: schedule1Ids,
        schedule2: schedule2Ids,
        schedule3: schedule3Ids,
        counts: {
          schedule1: schedule1Ids.length,
          schedule2: schedule2Ids.length,
          schedule3: schedule3Ids.length,
        },
      });
    }
  } catch (error) {
    console.error("Auto-completion error:", error);
  }
});
