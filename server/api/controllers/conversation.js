const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

exports.create = asyncHandler(async (req, res) => {
  var newConersation = req.body;

  const conversation = await model.conversations.create(newConersation);

  // Log
  const User = req.body.User;

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const logFile = logFolder + "/login.txt";

  var logInfo = "[Conversation Created] " + User.Name + " (" + User.Email + ") from " +
    User.LabName + " created a conversation at " +
    new Date().toString() + " - " + User.IP + "\r\n"

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).send(conversation);
  console.log("conversation created " + conversation.id);
});

// Delete an conversation with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  await model.conversations.destroy({
    where: { id: req.query.id }
  });

  // Log
  var User = JSON.parse(req.query.User);

  const logFolder = "api/logs";
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder)
  }

  const logFile = logFolder + "/login.txt";

  var logInfo = "[Conversation Deleted] " + User.Name + " (" + User.Email + ") from " +
    User.LabName + " deleted a conversation at " +
    new Date().toString() + " - " + User.IP + "\r\n"

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, logInfo)
  } else {
    fs.writeFileSync(logFile, logInfo)
  }

  res.status(200).send("conversation deleted.");
});
