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
      where: queryString,
      include: [{ model: model.family }],
    });

    schedules.forEach(async (schedule) => {
      await model.schedule.update(
        {
          Status: "Rejected",
          Completed: true,
        },
        { where: { id: schedule.id } }
      );

      await log.createLog(
        "Auto cancellation",
        User,
        "marked a schedule(" +
          schedule.id +
          ") as Rejected, due to the lack of update for two weeks."
      );
    });

    // release the families.
    IDs = schedules.map((schedule) => {
      return schedule.FK_Family;
    });
    IDs = Array.from(new Set(IDs)); // unique IDs

    if (IDs.length > 0) {
      // update family by removing AssignedLab from the family
      const updateFamilyInfo = { AssignedLab: null };

      await model.family.update(updateFamilyInfo, {
        where: { id: IDs },
      });

      // Log
      await log.createLog(
        "Family Lab Assisgnment Release",
        {},
        "Families (" +
          IDs.join(", ") +
          ") were no longer assigned to any lab due to auto cancellation."
      );
    }

    // res.status(200).send(schedules);
  } catch (error) {
    throw error;
  }
});

exports.autoCompletion = asyncHandler(async (req, res) => {
  var queryString = {};
  const User = {
    Name: "",
    Email: "",
    LabName: "",
  };

  // 1. search study appointments whose schedule time has passed but are yet marked as completed.
  // appointment time was 2 days before the current date.
  queryString.Status = "Confirmed";
  queryString.Completed = false;
  queryString.AppointmentTime = {
    [Op.lt]: moment()
      .subtract(2, "days")
      .startOf("day")
      .toDate(),
  };

  try {
    const schedules1 = await model.schedule.findAll({
      where: queryString,
      include: [{ model: model.family }],
    });

    schedules1.forEach(async (schedule) => {
      await model.schedule.update(
        {
          Completed: true,
        },
        { where: { id: schedule.id } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked a schedule(" +
          schedule.id +
          ") as Completed, due to its completion."
      );
    });

    // 2. search for appointments with **Tentative** status, if the last contacted date was 2 weeks ago, mark them as rejected, and completed.
    queryString.Status = {
      [Op.in]: ["TBD", "Rescheduling", "No Show", "Cancelled"],
    };
    queryString.Completed = false;
    queryString.updatedAt = {
      [Op.lt]: moment()
        .subtract(13, "days")
        .startOf("day")
        .toDate(),
    };

    const schedules2 = await model.schedule.findAll({
      where: queryString,
      include: [{ model: model.family }],
    });

    schedules2.forEach(async (schedule) => {
      await model.schedule.update(
        {
          Status: "Rejected",
          Completed: true,
        },
        { where: { id: schedule.id } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked a schedule(" +
          schedule.id +
          ") as Rejected, due to the lack of update for two weeks. The schedule was marked as Completed."
      );
    });

    // 3. search for appointments with **Rejected** status, mark them as completed.
    queryString.Status = "Rejected";
    queryString.Completed = false;

    const schedules3 = await model.schedule.findAll({
      where: queryString,
      include: [{ model: model.family }],
    });

    schedules3.forEach(async (schedule) => {
      await model.schedule.update(
        {
          Completed: true,
        },
        { where: { id: schedule.id } }
      );

      await log.createLog(
        "Auto Completion",
        {},
        "marked a schedule(" + schedule.id + ") as Completed."
      );
    });

    // res
    //   .status(200)
    //   .send({
    //     schedule1: schedules1,
    //     schedule2: schedules2,
    //     schedule3: schedules3,
    //   });
  } catch (error) {
    throw error;
  }
});
