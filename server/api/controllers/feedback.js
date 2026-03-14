const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");
const { sendAdminEmail } = require("../utils/emailUtil");

exports.create = asyncHandler(async (req, res) => {
  var newFeedback = req.body;

  try {
    const feedback = await model.feedback.create(newFeedback);

    await sendAdminEmail({
      to: "babylab@mcmaster.ca",
      cc: newFeedback.Email,
      subject: "[DRDB feedback] " + newFeedback.Title,
      htmlBody:
        "<p> from " +
        newFeedback.Email +
        "<p>" +
        "<p> on " +
        newFeedback.CurrentPage +
        " Page<p>" +
        "<p>====================<p>" +
        newFeedback.Content,
    });

    res.status(200).send(feedback);
    console.log("feedback created " + feedback.id);
  } catch (error) {
    return error;
  }
});
