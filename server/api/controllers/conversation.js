const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const fs = require("fs");

const log = require("../controllers/log");

exports.create = asyncHandler(async (req, res) => {
  var newConersation = req.body;

  const conversation = await model.conversations.create(newConersation);

  // Log
  const User = req.body.User;

  await log.createLog("Conversation Created", User, "created a conversation");

  res.status(200).send(conversation);
  console.log("conversation created " + conversation.id);
});

// Delete an conversation with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  await model.conversations.destroy({
    where: { id: req.query.id }
  });

  // Log
  const User = JSON.parse(req.query.User);

  await log.createLog("Conversation Deleted", User, "deleted a conversation");

  res.status(200).send("conversation deleted.");
});
