const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

const fs = require("fs");
const { OAuth2 } = google.auth;

async function generalAuth() {
  const credentialsPath = "api/google/general/credentials.json";
  const tokenPath = "api/google/general/token.json";

  const credentials = await fs.promises.readFile(credentialsPath);

  const { client_secret, client_id, redirect_uris } = JSON.parse(
    credentials
  ).installed;

  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

  const token = await fs.promises.readFile(tokenPath);
  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client;
}

function makeBody(to, from, cc, subject, body) {
  var message = [
    'Content-Type: text/html; charset="UTF-8"\n',
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ",
    to,
    "\n",
    "from: ",
    from,
    "\n",
    "cc: ",
    cc,
    "\n",
    "subject: ",
    subject,
    "\n\n",
    body,
  ].join("");

  var encodedMail = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return encodedMail;
}

async function sendEmail(oAuth2Client, emailContent) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  var raw = makeBody(
    emailContent.to,
    emailContent.from,
    emailContent.cc,
    emailContent.subject,
    emailContent.body
  );

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: raw,
      },
    });

    return result;
  } catch (error) {
    return error;
  }
}

exports.create = asyncHandler(async (req, res) => {
  var newFeedback = req.body;

  try {
    const feedback = await model.feedback.create(newFeedback);

    var emailContent = {
      to: "testuser@kangleelab.com",
      cc: newFeedback.Email,
      subject: "[DRDB feedback] " + newFeedback.Title,
      body:
        "<p> from " +
        newFeedback.Email +
        "<p>" +
        "<p> on " +
        newFeedback.CurrentPage +
        " Page<p>" +
        "<p>====================<p>" +
        newFeedback.Content,
    };

    const oAuth2Client = await generalAuth();

    await sendEmail(oAuth2Client, emailContent);

    res.status(200).send(feedback);
    console.log("feedback created " + feedback.id);
  } catch (error) {
    return error;
  }
});
