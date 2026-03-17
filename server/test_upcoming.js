const { Op } = require("sequelize");
const moment = require("moment");
const model = require("./api/models/DRDB");

async function testUpcoming() {
  const queryString = {
    AppointmentTime: { [Op.gte]: moment().toDate() },
    Status: "Confirmed",
    Completed: false,
    "$Family.TrainingSet$": false,
  };
  queryString["$Appointments.Study.FK_Lab$"] = 2; // admin is mapped to lab 2

  try {
    const schedules = await model.schedule.findAll({
      where: queryString,
      subQuery: false,
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.child, attributes: ["id", "Name", "DoB", "Age", "Sex"] },
            { model: model.study, attributes: ["id", "StudyName", "FK_TestingRoom"] },
            { model: model.personnel, as: "PrimaryExperimenter", through: { model: model.experimenterAssignment }, attributes: ["id", "Name"] },
          ],
        },
        { model: model.family, attributes: ["id", "NamePrimary", "NameSecondary", "Phone", "Email", "TrainingSet"] }
      ],
      order: [["AppointmentTime", "ASC"]],
      limit: 3,
    });
    console.log("Returned schedules: ", schedules.length);
    console.log(JSON.stringify(schedules, null, 2));
  } catch (error) {
    console.error("Test Error:", error);
  } finally {
    process.exit();
  }
}

testUpcoming();
