const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

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
    // emailContent.to,
    // "g.jaeger0226@gmail.com",
    "testuser@kangleelab.com",
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

exports.send = asyncHandler(async (req, res) => {
  const emailContent = req.body;

  try {
    const result = await sendEmail(req.oAuth2Client, emailContent);

    res.status(200).send(result);
  } catch (error) {
    throw error;
  }
});
