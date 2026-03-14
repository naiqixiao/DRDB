exports.URL = 'http://192.168.1.10';

const Sequelize = require("sequelize");
const timeZone = 'America/Toronto';
exports.timeZone = timeZone;

exports.sequelize = new Sequelize("DRDBBackup", "admin", "password", {
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

exports.DBName = "DRDBBackup";
exports.frontendURL = ["http://127.0.0.1"]
// mysql -h 'dbs' -u 'pnb_drdb' -p pnb_drdb