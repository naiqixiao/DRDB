const http = require("http");
const app = require("./app");
require("dotenv").config();

const port = process.env.port || 3000;

const server = http.createServer(app);


// Send reminder emails to parents the day before their appointment
var cron = require('node-cron');

const ReminderController = require("./api/controllers/reminder");

cron.schedule('0 15 * * *', async () => {

  const resonse = await ReminderController.reminderEmail();

  console.log(resonse);

});

const FamilyController = require("./api/controllers/family");

cron.schedule('0 9 * * *', async () => {

  await FamilyController.releaseFamily();

});

const ChildController = require("./api/controllers/child");

cron.schedule('5 0 * * *', async () => {

  await ChildController.updateAge();

});

// const io = require("socket.io")(server);

// io.on("connection", function(socket) {

//   //socket.broadcast.emit('hi');

//   console.log("a user connected");
//   socket.on("disconnect", function() {
//     console.log("user disconnected");
//   });

//   socket.on("chat message", function(msg) {
//     msg = msg.toUpperCase();
//     console.log("message: " + msg);
//     io.emit('receive a message', msg);
//   });

//   // socket.on("new_user", function(username) {
//   //   connection.query(
//   //     "SELECT * FROM users WHERE username = '" + username + "'",
//   //     function(error, result) {
//   //       if (result.length == 0) {
//   //         connection.query(
//   //           "INSERT INTO users(username) VALUES('" + username + "')",
//   //           function(error, result) {
//   //             io.emit("new_user", username);
//   //           }
//   //         );
//   //       } else {
//   //         io.emit("new_user", username);
//   //       }
//   //     }
//   //   );
//   // });

//   // socket.on("delete_message", function(id) {
//   //   connection.query("DELETE FROM messages WHERE id = '" + id + "'", function(
//   //     error,
//   //     result
//   //   ) {
//   //     io.emit("delete_message", id);
//   //   });
//   // });

//   // socket.on("new_message", function(data) {
//   //   connection.query(
//   //     "INSERT INTO messages(username, message) VALUES('" +
//   //       data.username +
//   //       "', '" +
//   //       data.message +
//   //       "')",
//   //     function(error, result) {
//   //       data.id = result.insertId;
//   //       io.emit("new_message", data);
//   //     }
//   //   );
//   // });
// });

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