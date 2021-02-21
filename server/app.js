const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const morgan = require("morgan");

app.use(morgan("dev"));

app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// app.use(bodyParser({limit: '50mb'}));

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
const experimenterAssignment2ndRoutes = require("./api/routes/experimenterAssignment_2nd");
const scheduleRoutes = require("./api/routes/schedule");

const calRoutes = require("./api/routes/calendar");
const gmailRoutes = require("./api/routes/gmail");

const extAPIRoutes = require("./api/routes/externalAPIs");
const feedbackRoutes = require("./api/routes/feedback");

const reminderRoutes = require("./api/routes/reminder");
const rtuRoutes = require("./api/routes/RTU");

app.use("/api/user", userRoutes);

app.use("/api/family", familyRoutes);
app.use("/api/child", childRoutes);
app.use("/api/conversation", conversationRoutes);

app.use("/api/study", studyRoutes);
app.use("/api/personnel", personnelRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/experimenter", experimenterRoutes);

app.use("/api/appointment", appointmentRoutes);
app.use("/api/experimentAssignment", experimenterAssignmentRoutes);
app.use("/api/experimentAssignment", experimenterAssignment2ndRoutes);
app.use("/api/schedule", scheduleRoutes);

app.use("/api/cal", calRoutes);
app.use("/api/gmail", gmailRoutes);

app.use("/api/extAPIs", extAPIRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/reminder", reminderRoutes);
app.use("/api/RTU", rtuRoutes);


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
