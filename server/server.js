const http = require("http");
const app = require("./app");
require("dotenv").config();

const port = process.env.port || 3000;

const server = http.createServer(app);

const Server = server.listen(port, function () {
  console.log("Listening to port " + port);
});

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

let connections = [];

Server.on('connection', connection => {
  connections.push(connection);
  connection.on('close', () => connections = connections.filter(curr => curr !== connection));
});

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  Server.close(() => {
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
registerJobs();
