// const { Op } = require("sequelize");

const config = require("../../config/general");
const fs = require("fs");
const path = require("path");

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
const Experimenter = sequelize.import("../models/SequelizeAuto/Experimenter");
const TestingRoom = sequelize.import("../models/SequelizeAuto/TestingRoom");

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
  exports.experimenterAssignment_2nd = SecondExperimenterAssignment;
  exports.feedback = Feedback;
  exports.testingRoom = TestingRoom;
  exports.sequelize = sequelize;
});

// Function to import SQL file
// async function importSqlFile(filePath) {
//   try {
//     // Read SQL file
//     const sql = fs.readFileSync(path.resolve(__dirname, filePath), "utf8");

//     // Split SQL file into individualqueries
//     const queries = sql.split(";");

//     let dbName = config.DBName;

//     // update child age info whenever connect to the database.
//     var queryString =
//       "UPDATE ${{DBName}}.Child Set Age = DATEDIFF(CURDATE(), DoB);";
//     queryString = queryString.replace(/\${{DBName}}/g, config.DBName);

//     try {
//       await sequelize.query(queryString);

//       await log.createLog("Age Updated", {}, "Children's age is updated");
//     } catch (error) {
//       throw error;
//     }

//     // database updates
//     let MySQLSyntax =
//       "SELECT CHARACTER_MAXIMUM_LENGTH from INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
//       dbName +
//       "' AND TABLE_NAME = 'Schedule' AND COLUMN_NAME = 'eventURL';";
//     const scheduleDataType = await sequelize.query(MySQLSyntax);

//     MySQLSyntax =
//       "SELECT CHARACTER_MAXIMUM_LENGTH from INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" +
//       dbName +
//       "' AND TABLE_NAME = 'Appointment' AND COLUMN_NAME = 'eventURL';";
//     const appointmentDataType = await sequelize.query(MySQLSyntax);

//     const scheduleEventURLLength =
//       scheduleDataType[0][0]["CHARACTER_MAXIMUM_LENGTH"];
//     const appointmentEventURLLength =
//       appointmentDataType[0][0]["CHARACTER_MAXIMUM_LENGTH"];

//     if (scheduleEventURLLength < 255 || appointmentEventURLLength < 255) {
//       for (const query of queries) {
//         console.log(query);
//         await sequelize.query(query);
//       }
//       console.log("Columns updated");
//     } else {
//       console.log("Columns up to date");
//     }

//     // Execute only ALTER TABLE statements for adding columns if they do not exist
//     for (const query of queries) {
//       queryString = query.replace(/\${{DBName}}/g, config.DBName);

//       if (queryString.trim().startsWith("ALTER TABLE")) {
//         if (queryString.includes("MODIFY")) {
//           const updateColumn = updateColumnLength(queryString);
//           if (updateColumn) {
//             await sequelize.query(queryString);
//           }
//           continue;
//         } else if (queryString.includes("ADD")) {
//           // Check if the column already exists
//           const columnExists = await columnExistsInTable(queryString);

//           // If the column does not exist, execute the ALTER TABLE statement
//           if (!columnExists) {
//             await sequelize.query(queryString);
//           }
//           continue;
//         }
//       }

//       if (queryString.trim().startsWith("CREATE TABLE")) {
//         const tableExists = await tableExistsInDatabase(queryString);
//         if (!tableExists) {
//           await sequelize.query(queryString);
//         }
//       }
//     }

//     console.log("SQL file imported successfully");
//   } catch (error) {
//     console.error("Error importing SQL file:", error);
//   }
// }

// // Function to check if a column exists in the table
// async function columnExistsInTable(queryString) {
//   const columnNameIndex = queryString.search("ADD") + 4;
//   const substring = queryString.substring(columnNameIndex);
//   const columnNameMatch = substring.match(/^\s*(\S+)/);
//   const columnName = columnNameMatch ? columnNameMatch[1] : null;

//   if (!columnName) {
//     return false;
//   }

//   const tableNameIndex = queryString.search("TABLE") + 5;
//   const tableSubstring = queryString.substring(tableNameIndex);
//   const tableNameMatch = tableSubstring.match(/^\s*(\S+)/);
//   const tableName = tableNameMatch ? tableNameMatch[1] : null;

//   const tableDescription = await sequelize
//     .getQueryInterface()
//     .describeTable(tableName);

//   return tableDescription[columnName] !== undefined;
// }

// async function tableExistsInDatabase(queryString) {
//   try {
//     const allTables = [];
//     const tables = await sequelize.getQueryInterface().showAllTables();
//     for (const table of tables) {
//       allTables.push(table.toLowerCase());
//     }
//     const tableNameIndex = queryString.search("TABLE") + 5;
//     const tableSubstring = queryString.substring(tableNameIndex);
//     const tableNameMatch = tableSubstring.match(/^\s*(\S+)/);
//     const tableName = tableNameMatch ? tableNameMatch[1] : null;
//     return allTables.includes(tableName);
//   } catch (error) {
//     console.error("Error checking if table exists:", error);
//     return false;
//   }
// }

// async function updateColumnLength() {
//   try {
//     var queryString =
//       "SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH from INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Schedule' AND COLUMN_NAME = 'eventURL'";

//     const scheduleDataType = await sequelize.query(queryString);

//     queryString =
//       "SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH from INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Appointment' AND COLUMN_NAME = 'eventURL'";

//     const appointmentDataType = await sequelize.query(queryString);

//     const scheduleEventURLLength =
//       scheduleDataType[0][0]["CHARACTER_MAXIMUM_LENGTH"];
//     const appointmentEventURLLength =
//       appointmentDataType[0][0]["CHARACTER_MAXIMUM_LENGTH"];

//     if (scheduleEventURLLength < 255 || appointmentEventURLLength < 255) {
//       return true;
//     }

//     return false;
//   } catch (err) {
//     console.error("error: " + err.message);
//   }
// }

// // Import SQL file
// importSqlFile("../../../MySQL/databaseUpdate.sql");
