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

// Do not accept traffic or start scheduled jobs until required migrations pass.
schemaReady
  .then(() => {
    server.listen(port, function () {
      console.log("Listening to port " + port);
    });
    const { registerJobs } = require("./jobs/scheduler");
    registerJobs().catch((error) => {
      console.error("[Jobs] Failed to register scheduled tasks:", error);
    });
  })
  .catch((error) => {
    console.error("[Startup] Database initialization failed; backend was not started:", error);
    process.exit(1);
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
