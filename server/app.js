const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const morgan = require("morgan");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerDef');

app.use(morgan("dev"));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(bodyParser.json({ limit: '100mb' }));

const cors = require("cors");
const config = require("./config/general");

app.use(cors({
  origin: config.frontendURL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));

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
const jobsRoutes = require("./api/routes/jobs");

const testingRoomRoutes = require("./api/routes/testingRoom");

const emailTestRoutes = require("./api/routes/emailTest");
const calendarTestRoutes = require("./api/routes/calendarTest");

const auto = require("./api/routes/auto");

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
app.use("/api/auto", auto);

app.use("/api/cal", calRoutes);
app.use("/api/gmail", gmailRoutes);

app.use("/api/extAPIs", extAPIRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/reminder", reminderRoutes);
app.use("/api/RTU", rtuRoutes);
app.use("/api/jobs", jobsRoutes);

app.use("/api/TestingRoom", testingRoomRoutes);

app.use("/api/emailTest", emailTestRoutes);
app.use("/api/calendarTest", calendarTestRoutes);

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
