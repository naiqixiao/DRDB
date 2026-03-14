const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");
const { sendAdminEmail } = require("../utils/emailUtil");
const { buildFeedbackEmail } = require("../utils/userTemplates");

exports.create = asyncHandler(async (req, res) => {
  var newFeedback = req.body;

  try {
    const feedback = await model.feedback.create(newFeedback);

    const feedbackEmail = buildFeedbackEmail(
      newFeedback.Email,
      newFeedback.CurrentPage,
      newFeedback.Title,
      newFeedback.Content
    );
    await sendAdminEmail(feedbackEmail);

    res.status(200).send(feedback);
    console.log("feedback created " + feedback.id);
  } catch (error) {
    return error;
  }
});
