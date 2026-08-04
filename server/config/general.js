const Sequelize = require("sequelize");

require("dotenv").config();

const timeZone = process.env.TIMEZONE || "America/Toronto";
const databaseName = process.env.DB_NAME || "DRDB";

exports.URL = process.env.URL || "http://localhost:8080";
exports.timeZone = timeZone;
exports.otherRequirement = process.env.OTHER_REQUIREMENT || "";
exports.DBName = databaseName;
exports.frontendURL = (process.env.FRONTEND_URL || "http://localhost:8080")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

exports.sequelize = new Sequelize(
  databaseName,
  process.env.DB_USER || "drdb",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: process.env.DB_DIALECT || "mariadb",
    logging: false,
    define: { freezeTableName: true },
    timezone: timeZone,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);
