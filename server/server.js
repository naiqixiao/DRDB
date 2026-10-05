require("dotenv").config();
const http = require("http");
const app = require("./app");

const port = process.env.PORT || process.env.port || 3000;

const { schemaReady } = require("./api/models/DRDB");

const server = http.createServer(app);

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

let connections = [];

server.on('connection', connection => {
  connections.push(connection);
  connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

// Wait for startup schema patches so no request selects a column that is not there yet.
// Listen even if sync fails, matching the previous behaviour; errors are logged.
schemaReady
  .catch((error) => console.error("Database sync failed:", error))
  .then(() => {
    server.listen(port, function () {
      console.log("Listening to port " + port);
    });
  });

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);

  connections.forEach(curr => curr.end());
  setTimeout(() => connections.forEach(curr => curr.destroy()), 5000);
}

// ─── Scheduled Jobs ───────────────────────────────────────────────
// All cron jobs are defined in jobs/scheduler.js.
// In a clustered environment, wrap this in a primary-worker check
// to prevent duplicate execution (e.g. cluster.isPrimary).
const { registerJobs } = require("./jobs/scheduler");
registerJobs().catch((error) => {
  console.error("[Jobs] Failed to register scheduled tasks:", error);
});
