const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");

exports.create = asyncHandler(async (req, res) => {
  var newFeedback = req.body;

  const feedback = await model.feedbacks.create(newFeedback);

  res.status(200).send(feedback);
  console.log("feedback created " + feedback.id);
});
