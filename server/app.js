const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const morgan = require("morgan");

app.use(morgan("dev"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routers
const userRoutes = require("./api/routes/user");

const familyRoutes = require("./api/routes/family");
const childRoutes = require("./api/routes/child");
const conversationRoutes = require("./api/routes/conversation");

const studyRoutes = require("./api/routes/study");
const personnelRoutes = require("./api/routes/personnel");
const labRoutes = require("./api/routes/lab");
const experimenterRoutes = require("./api/routes/experimenter");

const appointmentRoutes = require("./api/routes/appointment");
const experimenterAssignmentRoutes = require("./api/routes/experimenterAssignment");
const scheduleRoutes = require("./api/routes/schedule");

const calRoutes = require("./api/routes/calendar");
const gmailRoutes = require("./api/routes/gmail");

const extAPIRoutes = require("./api/routes/externalAPIs");

app.use("/user", userRoutes);

app.use("/family", familyRoutes);
app.use("/child", childRoutes);
app.use("/conversation", conversationRoutes);

app.use("/study", studyRoutes);
app.use("/personnel", personnelRoutes);
app.use("/lab", labRoutes);
app.use("/experimenter", experimenterRoutes);

app.use("/appointment", appointmentRoutes);
app.use("/experimentAssignment", experimenterAssignmentRoutes);
app.use("/schedule", scheduleRoutes);

app.use("/cal", calRoutes);
app.use("/gmail", gmailRoutes);

app.use("/extAPIs", extAPIRoutes);

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });

// Error handling
app.use((req, res, next) => {
  const error = new Error("Not found.");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;
