const Sequelize = require("sequelize");

exports.URL = 'URL of the system';
const timeZone = 'America/Toronto';
exports.timeZone = timeZone;

exports.otherRequirement = ''

exports.sequelize = new Sequelize("Database_Name", "User", "Password", {
  host: "mysql",
  dialect: "mysql",
  logging: false,
  define: {
    // timestamps: false,
    freezeTableName: true,
  },
  timeZone: timeZone,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

exports.DBName = "DRDB";
exports.frontendURL = ["example URL"]