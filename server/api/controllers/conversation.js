const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

exports.create = asyncHandler(async (req, res) => {
  var newConersation = req.body;

  const conversation = await model.conversations.create(newConersation);

  res.status(200).send(conversation);
  console.log("conversation created " + conversation.id);
});

// Delete an conversation with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  await model.conversations.destroy({
    where: req.query
  });
  res.status(200).send("conversation deleted.");
});
