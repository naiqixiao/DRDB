const asyncHandler = require("express-async-handler");
const { sendLabEmail } = require("../utils/emailUtil");

exports.send = asyncHandler(async (req, res) => {
  const emailContent = req.body;

  try {
    const result = await sendLabEmail(req.oAuth2Client, {
      to: emailContent.to,
      from: emailContent.from,
      cc: emailContent.cc,
      bcc: emailContent.bcc,
      subject: emailContent.subject,
      htmlBody: emailContent.body,
      labelNames: emailContent.labelNames,
    });

    res.status(200).send(result);
  } catch (error) {
    throw error;
  }
});
