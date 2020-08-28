const Sequelize = require("sequelize");
const { Op } = require("sequelize");

const sequelize = new Sequelize("DRDB", "admin", "password", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  define: {
    // timestamps: false,
    freezeTableName: true,
  },
  timeZone: "America/Toronto",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// const sequelize = new Sequelize("pnb_drdb", "pnb_drdb", "kohta37ahtae", {
//   host: "mysql",
//   dialect: "mysql",
//   logging: false,
//   define: {
//     // timestamps: false,
//     freezeTableName: true,
//   },
//   timeZone: "America/Toronto",
//   pool: {
//     max: 10,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
// });

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Family, Child, Conversations
const Family = sequelize.import("../models/SequelizeAuto/Family");
const Child = sequelize.import("../models/SequelizeAuto/Child");
const Sibling = sequelize.import("../models/SequelizeAuto/Sibling");
const Conversations = sequelize.import(
  "../models/SequelizeAuto/Conversations.js"
);

Family.hasMany(Child, {
  foreignKey: "FK_Family",
});
Child.belongsTo(Family, {
  foreignKey: "FK_Family",
});

Family.hasMany(Conversations, {
  foreignKey: "FK_Family",
});

Conversations.belongsTo(Family, {
  foreignKey: "FK_Family",
});

Child.belongsToMany(Child, {
  as: "child",
  through: "Sibling",
  foreignKey: "FK_Child",
  otherKey: "Sibling",
});
Child.belongsToMany(Child, {
  as: "sibling",
  through: "Sibling",
  foreignKey: "Sibling",
  otherKey: "FK_Child",
});

// Personnel, Study, Experimenter, Lab

const Lab = sequelize.import("../models/SequelizeAuto/Lab");
const Personnel = sequelize.import("../models/SequelizeAuto/Personnel");
const Study = sequelize.import("../models/SequelizeAuto/Study");
const Experimenter = sequelize.import("../models/SequelizeAuto/Experimenter");

Lab.hasMany(Personnel, {
  foreignKey: "FK_Lab",
});
Personnel.belongsTo(Lab, {
  foreignKey: "FK_Lab",
});

Lab.hasMany(Study, {
  foreignKey: "FK_Lab",
});
Study.belongsTo(Lab, {
  foreignKey: "FK_Lab",
});

Lab.hasMany(Family, {
  foreignKey: "AssignedLab",
});
Family.belongsTo(Lab, {
  foreignKey: "AssignedLab",
});

Personnel.belongsToMany(Study, {
  through: "Experimenter",
  foreignKey: "FK_Experimenter",
  otherKey: "FK_Study",
});
Study.belongsToMany(Personnel, {
  through: "Experimenter",
  foreignKey: "FK_Study",
  otherKey: "FK_Experimenter",
});

Family.belongsTo(Personnel, {
  foreignKey: "CreatedBy",
});
Personnel.hasMany(Family, {
  foreignKey: "CreatedBy",
});

Family.belongsTo(Personnel, {
  foreignKey: "UpdatedBy",
});
Personnel.hasMany(Family, {
  foreignKey: "UpdatedBy",
});

// Schedule & Appointment
const Schedule = sequelize.import("../models/SequelizeAuto/Schedule");
const Appointment = sequelize.import("../models/SequelizeAuto/Appointment");
const ExperimenterAssignment = sequelize.import(
  "../models/SequelizeAuto/ExperimenterAssignment"
);

Appointment.belongsTo(Family, {
  foreignKey: "FK_Family",
});
Family.hasMany(Appointment, {
  foreignKey: "FK_Family",
});

Appointment.belongsTo(Child, {
  foreignKey: "FK_Child",
});
Child.hasMany(Appointment, {
  foreignKey: "FK_Child",
});

Appointment.belongsTo(Study, {
  foreignKey: "FK_Study",
});
Study.hasMany(Appointment, {
  foreignKey: "FK_Study",
});

Appointment.belongsTo(Schedule, {
  foreignKey: "FK_Schedule",
});
Schedule.hasMany(Appointment, {
  foreignKey: "FK_Schedule",
});

Personnel.belongsToMany(Appointment, {
  through: "ExperimenterAssignment",
  foreignKey: "FK_Experimenter",
  otherKey: "FK_Appointment",
});
Appointment.belongsToMany(Personnel, {
  through: "ExperimenterAssignment",
  foreignKey: "FK_Appointment",
  otherKey: "FK_Experimenter",
});

Schedule.belongsTo(Personnel, {
  foreignKey: "ScheduledBy",
});
Personnel.hasMany(Schedule, {
  foreignKey: "ScheduledBy",
});


// Feedback
const Feedback = sequelize.import("../models/SequelizeAuto/Feedback");
Feedback.belongsTo(Personnel, {
  foreignKey: "CreatedBy",
});

// Syncronize with database
sequelize.sync({ force: false }).then(() => {
  exports.family = Family;
  exports.child = Child;
  exports.conversations = Conversations;
  exports.study = Study;
  exports.appointment = Appointment;
  exports.schedule = Schedule;
  exports.lab = Lab;
  exports.personnel = Personnel;
  exports.experimenter = Experimenter;
  exports.sibling = Sibling;
  exports.experimenterAssignment = ExperimenterAssignment;
  exports.feedback = Feedback;
  exports.sequelize = sequelize;
});
