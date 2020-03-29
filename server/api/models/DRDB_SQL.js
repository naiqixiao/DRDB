const mysql = require("mysql");

const con = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: "password",
  database: "DRDB",
  debug: false,
  multipleStatements: true
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = con;
