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

  const labelIds = [];

  try {
    if (emailContent.labelNames) {
      const labelNames = emailContent.labelNames;

      const gmailLabelList = await gmail.users.labels.list({
        userId: "me",
      });

      const labels = gmailLabelList.data.labels;

      for (const labelName of labelNames) {
        const label = labels.find(
          (label) =>
            label.name.replace(/[^a-zA-Z0-9]/g, "") ===
            labelName.replace(/[^a-zA-Z0-9]/g, "")
        );

        let labelId;

        if (label) {
          labelId = label.id;
        } else {
          const labelData = {
            userId: "me",
            resource: {
              name: labelName,
              labelListVisibility: "labelShow",
            },
          };

          const labelResponse = await gmail.users.labels.create(labelData);
          labelId = labelResponse.data.id;

        }

        labelIds.push(labelId);
      }
    }

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: raw,
        labelIds: labelIds,
      },
    });

    // apply labels after sending the email
    if (labelIds.length > 0) {
      const messageId = result.data.id;

      const modifyRequest = {
        userId: "me",
        id: messageId,
        resource: {
          addLabelIds: labelIds,
        },
      };
      await gmail.users.messages.modify(modifyRequest);
    }

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
