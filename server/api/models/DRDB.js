const config = require("../../config/general");

const sequelize = config.sequelize;
const log = require("../controllers/log");

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
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

// Personnel, Study, Experimenter, Lab, TestingRoom

const Lab = sequelize.import("../models/SequelizeAuto/Lab");
const Personnel = sequelize.import("../models/SequelizeAuto/Personnel");
const Study = sequelize.import("../models/SequelizeAuto/Study");
const StudyAgeGroup = sequelize.import("../models/SequelizeAuto/StudyAgeGroup");
const Experimenter = sequelize.import("../models/SequelizeAuto/Experimenter");
const TestingRoom = sequelize.import("../models/SequelizeAuto/TestingRoom");
const ScheduledJobSetting = sequelize.import(
  "../models/SequelizeAuto/ScheduledJobSetting"
);

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

Lab.hasMany(TestingRoom, {
  foreignKey: "FK_Lab",
});
TestingRoom.belongsTo(Lab, {
  foreignKey: "FK_Lab",
});

Lab.hasMany(ScheduledJobSetting, {
  foreignKey: "FK_Lab",
});
ScheduledJobSetting.belongsTo(Lab, {
  foreignKey: "FK_Lab",
});

Personnel.hasMany(Study, {
  foreignKey: "FK_Personnel",
  as: "StudyinCharge",
});
Study.belongsTo(Personnel, {
  foreignKey: "FK_Personnel",
  as: "PointofContact",
});

Personnel.belongsToMany(Study, {
  through: "Experimenter",
  foreignKey: "FK_Experimenter",
  otherKey: "FK_Study",
  as: "AssignedStudies",
});
Study.belongsToMany(Personnel, {
  through: "Experimenter",
  foreignKey: "FK_Study",
  otherKey: "FK_Experimenter",
  as: "Experimenters",
});

// Age Groups (One-to-Many)
Study.hasMany(StudyAgeGroup, { foreignKey: "FK_Study", as: "AgeGroups" });
StudyAgeGroup.belongsTo(Study, { foreignKey: "FK_Study" });

// Prerequisites (Many-to-Many self-referencing)
const StudyPrerequisites = sequelize.define('StudyPrerequisites', {}, { timestamps: false, tableName: 'StudyPrerequisites' });

Study.belongsToMany(Study, {
  as: "Prerequisites",
  through: StudyPrerequisites,
  foreignKey: "StudyId",
  otherKey: "RequirementId",
});

// Exclusions (Many-to-Many self-referencing)
const StudyExclusions = sequelize.define('StudyExclusions', {}, { timestamps: false, tableName: 'StudyExclusions' });

Study.belongsToMany(Study, {
  as: "Exclusions",
  through: StudyExclusions,
  foreignKey: "StudyId",
  otherKey: "ExcludedId",
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
const SecondExperimenterAssignment = sequelize.import(
  "../models/SequelizeAuto/SecondExperimenterAssignment"
);

Appointment.belongsTo(Family, {
  foreignKey: "FK_Family",
});
Family.hasMany(Appointment, {
  foreignKey: "FK_Family",
});

Schedule.belongsTo(Family, {
  foreignKey: "FK_Family",
});
Family.hasMany(Schedule, {
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
  as: "PrimaryExperimenterof",
});
Appointment.belongsToMany(Personnel, {
  through: "ExperimenterAssignment",
  foreignKey: "FK_Appointment",
  otherKey: "FK_Experimenter",
  as: "PrimaryExperimenter",
});

Personnel.belongsToMany(Appointment, {
  through: "SecondExperimenterAssignment",
  foreignKey: "FK_Experimenter",
  otherKey: "FK_Appointment",
  as: "SecondaryExperimenterof",
});
Appointment.belongsToMany(Personnel, {
  through: "SecondExperimenterAssignment",
  foreignKey: "FK_Appointment",
  otherKey: "FK_Experimenter",
  as: "SecondaryExperimenter",
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

// Export models immediately (associations are already set up above)
exports.family = Family;
exports.child = Child;
exports.conversations = Conversations;
exports.study = Study;
exports.studyAgeGroup = StudyAgeGroup;
exports.appointment = Appointment;
exports.schedule = Schedule;
exports.lab = Lab;
exports.personnel = Personnel;
exports.experimenter = Experimenter;
exports.sibling = Sibling;
exports.experimenterAssignment = ExperimenterAssignment;
exports.experimenterAssignment_2nd = SecondExperimenterAssignment;
exports.feedback = Feedback;
exports.testingRoom = TestingRoom;
exports.scheduledJobSetting = ScheduledJobSetting;
exports.sequelize = sequelize;

// Synchronize with database (tables created/updated in background)
sequelize.sync({ force: false });
