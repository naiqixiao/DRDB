const Sequelize = require("sequelize");

exports.URL = 'http://localhost:3001';
exports.timeZone = 'America/Toronto';
exports.DBName = "DRDB_TEST";
exports.frontendURL = ["http://localhost:8080"];

// Mock sequelize instance
exports.sequelize = {
  authenticate: async () => true,
  sync: async () => true,
  import: () => ({
    hasMany: () => {},
    belongsTo: () => {},
    belongsToMany: () => {},
  }),
  define: () => ({}),
  query: async () => [],
};
