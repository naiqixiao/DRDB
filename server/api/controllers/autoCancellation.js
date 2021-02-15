const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const moment = require("moment");
const log = require("../controllers/log");

exports.autoCancellation = asyncHandler(async (req, res) => {

    // mark TBD & Rescheduling appointments scheduled a month ago as rejected.
    var queryString = {};
    const User = {
        Name: '',
        Email: '',
        LabName: ''

    };

    queryString['$Family.NextContactDate$'] = {
        [Op.lte]: moment().subtract(1, "months").toDate()
    };

    queryString.Status = { [Op.in]: ['TBD', 'Rescheduling'] }

    try {
        const schedules = await model.schedule.findAll(
            {
                where: queryString,
                include: [{ model: model.family }]
            })

        schedules.forEach(async schedule => {

            await model.schedule.update(
                {
                    Status: 'Rejected',
                    Completed: 1
                },
                { where: { id: schedule.id } }
            )

            await log.createLog("Auto cancellation", User, "marked a schedule(" +
                schedule.id +
                ") as Rejected, due to the lack of update for one month.");
        });

        // res.status(200).send(schedules);
    } catch (error) {
        throw error;
    }
});