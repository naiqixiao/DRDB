const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

function makeBody(to, from, cc, bcc, subject, body) {
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
    "bcc: ",
    bcc,
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
    emailContent.bcc,
    emailContent.subject,
    emailContent.body
  );

  try {
    const labelNames = [];
    for (const appointment of emailContent.appointments) {
      if (appointment.Study.StudyName) {
        labelNames.push(appointment.Study.StudyName);
      }
    }

    const listLabelsResponse = await gmail.users.labels.list({
      userId: 'me'
    });

    const labels = listLabelsResponse.data.labels;
    const labelIds = [];

    for (let i = 0; i < labelNames.length; i++) {
      const labelName = labelNames[i];
      const label = labels.find(l => l.name === labelName);
      let labelId;

      if (label) {
        labelId = label.id;
      } else {
        const labelData = {
          userId: 'me',
          resource: {
            name: labelName,
            labelListVisibility: 'labelShow'
          }
        };
  
        const labelResponse = await gmail.users.labels.create(labelData);
        labelId = labelResponse.data.id;
      }

      labelIds.push(labelId);
    }

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
        labelIds: labelIds
      },
    });

    const messageId = result.data.id;

    const modifyRequest = {
      userId: 'me',
      id: messageId,
      resource: {
        addLabelIds: labelIds
      }
    };
    await gmail.users.messages.modify(modifyRequest);


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
